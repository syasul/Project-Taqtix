# TAQtix Backend — TASK.md

> **WAJIB BACA DULU:** `../shared/API_CONTRACT.md` — semua endpoint, model data, dan format response di project ini HARUS persis mengikuti kontrak itu. Jangan mengarang bentuk response sendiri.

## Tech Stack (rekomendasi, sesuaikan kalau sudah ada preferensi)
- **Runtime:** Node.js 20+ dengan TypeScript
- **Framework:** NestJS (modular, cocok buat konsistensi saat vibe coding — struktur folder sudah dipaksa rapi)
- **Database:** PostgreSQL (butuh transaction & row-level lock untuk anti double-booking)
- **ORM:** Prisma
- **Queue/Cache:** Redis + BullMQ (untuk job async: notifikasi WA, email, settlement)
- **Auth:** JWT (access token + refresh token)
- **Payment:** DOKU (payment gateway yang dipakai — bukan Midtrans/Xendit)
- **WhatsApp:** WhatsApp Business API / provider pihak ketiga (Fonnte, Wablas, atau resmi Meta Cloud API)
- **File storage:** LOKAL di server yang sama (bukan S3/cloud storage) — simpan di direktori terpisah (misal `/var/www/taqtix-uploads/`), serve lewat Nginx sebagai static file. **Konsekuensi penting yang harus disadari:**
  - Tidak ada redundancy otomatis seperti S3 — kalau disk server rusak/corrupt, semua gambar (banner, logo, foto lineup) hilang bersamaan dengan itu. WAJIB masuk ke rencana backup rutin (bukan cuma backup database, backup folder upload ini juga)
  - Disk space terbatas dan SATU KUOTA dengan aplikasi lain di server yang sama — pantau pemakaian disk secara berkala, jangan sampai penuh tanpa disadari (penuhnya disk bisa bikin aplikasi lain di server ikut gagal, bukan cuma TAQtix)
  - Kalau nanti traffic besar, serve static file dari server aplikasi yang sama akan membebani proses Node.js/Nginx yang sama dengan yang melayani API — pertimbangkan pindah ke object storage (S3/R2) sebagai upgrade path kalau sudah mulai terasa berat, jangan dipaksakan lokal selamanya

## Environment Variables
```
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
QR_SIGNING_SECRET=          # secret KHUSUS untuk sign QR, beda dari JWT auth
PAYMENT_PROVIDER_KEY=
PAYMENT_PROVIDER_SECRET=
WA_PROVIDER_API_KEY=
UPLOAD_STORAGE_PATH=/var/www/taqtix-uploads
UPLOAD_PUBLIC_BASE_URL=https://api.taqtix.id/uploads
DOKU_CLIENT_ID=
DOKU_SECRET_KEY=
```

## Struktur Folder Target
```
src/
  modules/
    auth/
    events/
    ticket-categories/
    orders/
    payments/
    tickets/
    gate/
    partners/
    notifications/
    organizer-dashboard/
    admin/                # main admin platform, akses lintas organizer
    settlements/
  common/
    guards/            # role guard (buyer/organizer/gate_staff)
    interceptors/       # response envelope wrapper
    filters/             # error handling → format sesuai API_CONTRACT error codes
    decorators/
  prisma/
    schema.prisma
    migrations/
  jobs/
    queues/              # BullMQ queue definitions
    processors/          # WA notification, settlement, dll
main.ts
```

---

## FASE 0 — Foundation & Setup

- [x] Init NestJS project + TypeScript strict mode
- [x] Setup Prisma + koneksi PostgreSQL
- [x] Buat schema Prisma untuk semua model di `API_CONTRACT.md` section 2 (Event, TicketCategory, Order, OrderItem, Ticket, Payment, Partner)
- [x] Run migration pertama
- [x] Setup response envelope global interceptor (`{ success, data }` / `{ success, error }`)
- [x] Setup global exception filter → mapping ke error codes di kontrak
- [x] Setup auth module: register, login, JWT strategy, role guard
- [x] Setup `gate-login` endpoint terpisah (scoped token, hanya bisa akses `/gate/*`)
- [x] Seed 1 akun `admin` manual lewat script (BUKAN lewat endpoint register publik — role admin tidak boleh bisa didaftarkan sendiri oleh siapa pun)
- [x] Setup role guard khusus admin (`AdminGuard`) yang cek `role === 'admin'` untuk semua route `/admin/*`
- [x] Setup Redis connection + BullMQ base config
- [x] Setup `.env.example` dan dokumentasi cara run lokal (docker-compose untuk Postgres+Redis kalau perlu)

**Definition of done:** Server jalan, `/auth/register` dan `/auth/login` bisa dites via Postman/Thunder Client, return token JWT valid.

---

## FASE 1 — Core Ticketing (SELL Engine)

### Organizer Registration Flow
- [x] Saat organizer register, set status default `pending` (bukan langsung `active`)
- [x] Organizer dengan status `pending`/`suspended` TIDAK BOLEH bisa publish event — cek status di endpoint publish
- [x] (Opsional MVP awal: bisa auto-approve dulu kalau approval manual bikin lambat onboarding, tapi tetap sediakan endpoint admin untuk suspend kalau ada masalah)

### Event & Ticket Category
- [x] `POST /organizer/events` — create event (status default `draft`)
- [x] `PATCH /organizer/events/:id` — update
- [x] `POST /organizer/events/:id/publish` — ubah status jadi `published`
- [x] `GET /events` — list published event (public, dengan pagination)
- [x] `GET /events/:slug` — detail + ticket categories nested
- [x] `POST /organizer/events/:id/ticket-categories` — tambah kategori
- [x] `PATCH /organizer/ticket-categories/:id` — update kategori

### Order & Checkout (BAGIAN PALING KRITIKAL — hati-hati)
- [x] `POST /orders` — create order:
  - [x] Cek quota tersedia (`quota - sold >= requested qty`)
  - [x] **Gunakan transaction + row lock** (`SELECT ... FOR UPDATE` atau optimistic locking dengan version field) saat increment `sold` — ini WAJIB untuk cegah double booking saat concurrent request
  - [x] Set order status `pending`, `expiredAt` = now + 10 menit
  - [x] Kalau ada `promoCode`, validasi & hitung diskon
  - [x] Kalau ada `affiliateCode`, catat di order untuk tracking komisi nanti
- [x] `POST /orders/validate-promo` — validasi promo code terpisah (dipakai FE untuk live-check)
- [x] `GET /orders/:id` — detail order
- [x] Job scheduler: auto-expire order yang belum dibayar setelah `expiredAt` → kembalikan quota (`sold -= qty`)

### Payment
- [x] Integrasi payment gateway DOKU Checkout (`createDokuPayment` dengan HMAC-SHA256 signature, fallback Midtrans/Simulator)
- [x] `POST /payments/webhook/:provider` — terima callback, verifikasi signature dari provider (DOKU & Midtrans)
- [x] Saat payment sukses:
  - [x] Update order status → `paid`
  - [x] Generate Ticket + QR untuk setiap `OrderItem` (qty sesuai)
  - [x] Trigger job notifikasi (kirim e-ticket via WA + email)
- [x] `GET /payments/:orderId/status` — untuk polling dari FE

### QR & Ticket
- [x] Implementasi signing QR payload sesuai format di `API_CONTRACT.md` section 3
- [x] `GET /tickets/:id` — detail e-ticket (public via link, tidak perlu login)
- [x] `GET /tickets/by-order/:orderId` — list tiket dalam order

### Notification Jobs
- [x] Queue processor: kirim e-ticket via WhatsApp setelah payment sukses
- [x] Queue processor: kirim email confirmation
- [x] (Opsional MVP awal, bisa nyusul) Scheduled job H-7 dan H-1 reminder

**Definition of done:** Dari create event → publish → buyer checkout → bayar (sandbox) → e-ticket ter-generate dengan QR valid → notifikasi terkirim. Test dengan concurrent request ke endpoint order untuk pastikan tidak ada double booking (misal pakai k6/autocannon, 50 request bersamaan ke 1 kategori dengan quota 10).

---

## FASE 2 — Event Day: Scanner & Check-in

- [x] `GET /gate/events/:eventId/manifest` — return semua tiket event (id, qrPayload hash, status) untuk di-cache mobile app sebelum hari-H
- [x] `POST /gate/scan` — validasi 1 QR:
  - [x] Verify signature & expiry
  - [x] Cek status tiket (`valid` → oke, `checked_in` → return `QR_ALREADY_USED`)
  - [x] Update status jadi `checked_in`, catat `checkedInAt`, `checkedInBy`
- [x] `POST /gate/scan/batch` — terima array hasil scan dari mode offline, proses semua, return summary (berapa sukses, berapa conflict/duplikat)
- [x] `GET /gate/events/:eventId/live-count` — hitung real-time: expected, checked-in, remaining
- [x] Handle race condition: 2 gate scan QR sama persis dalam waktu berdekatan (pakai unique constraint / lock di level DB)

**Definition of done:** Simulasi scan dari 2 device berbeda ke tiket yang sama → hanya 1 yang sukses, satunya dapat `QR_ALREADY_USED`. Batch sync dari data "offline" bisa diproses tanpa duplikasi.

---

## FASE 3 — Distribution Engine (Affiliate/Partner)

- [x] `POST /organizer/events/:eventId/partners` — create partner + generate `uniqueCode`
- [x] `GET /organizer/events/:eventId/partners` — list + metrics (clicks, conversions, revenue, commission)
- [x] `POST /track/click/:partnerCode` — increment click counter (dipanggil saat orang klik link partner, redirect ke event page)
- [x] Saat order dibuat dengan `affiliateCode`, dan order jadi `paid` → increment `conversions`, `revenueGenerated`, hitung `commissionEarned` di record Partner
- [x] `GET /organizer/events/:eventId/partners/leaderboard` — sort by revenue/conversions

**Definition of done:** Klik link partner tercatat, kalau lanjut beli & bayar, komisi otomatis kehitung dan muncul di leaderboard.

---

## FASE 4 — Organizer Dashboard Endpoints

- [x] `GET /organizer/events/:id/dashboard` — aggregate: total sold, revenue, sisa quota per kategori
- [x] `GET /organizer/events/:id/buyers` — list semua buyer + export-able (CSV endpoint opsional via `/organizer/events/:id/buyers/export`)

---

## FASE 5 — Main Admin (Platform Oversight)

Ini yang bikin kamu (atau tim internal) bisa mantau & kontrol seluruh platform, bukan cuma 1 EO.

- [x] `GET /admin/dashboard` — aggregate lintas SEMUA organizer: total organizer aktif, total event, total revenue platform, total fee terkumpul
- [x] `GET /admin/organizers` — list semua organizer + status (pending/active/suspended) + filter
- [x] `GET /admin/organizers/:id` — detail organizer + list event miliknya
- [x] `POST /admin/organizers/:id/approve` — approve organizer baru
- [x] `POST /admin/organizers/:id/suspend` — suspend (misal dispute/penyalahgunaan) — pastikan efeknya organizer itu tidak bisa publish event baru & event yang sedang jalan bisa di-force-unpublish kalau perlu
- [x] `PATCH /admin/organizers/:id/plan` — ubah plan (starter/pro/enterprise), ini yang nentuin fee/fitur organizer tsb
- [x] `GET /admin/events` — list semua event lintas organizer (untuk moderasi)
- [x] `POST /admin/events/:id/force-unpublish` — force unpublish event bermasalah
- [x] `GET /admin/orders` — search order lintas organizer (untuk keperluan support kalau ada komplain buyer)
- [x] Setup module `settlements`:
  - [x] Job/cron: setelah event `ended`, hitung settlement per event (`grossRevenue - platformFee - affiliateCommissionTotal = netAmount`), simpan status `pending`
  - [x] `GET /admin/settlements` — list yang perlu diproses
  - [x] `POST /admin/settlements/:id/mark-paid` — tandai sudah ditransfer manual (belum perlu payout otomatis di MVP)
  - [x] `POST /admin/settlements/calculate` — trigger manual untuk kalkulasi batch settlement event yang telah berakhir
- [x] `GET /admin/audit-log` — catat setiap aksi admin (approve, suspend, force-unpublish, mark-paid) dengan `adminId`, `action`, `targetId`, `timestamp` — penting untuk akuntabilitas kalau ada dispute

**Definition of done:** Login sebagai admin → bisa lihat semua organizer & event yang ada di sistem (bukan cuma 1), bisa approve organizer baru, dan bisa tandai settlement sudah dibayar. Coba juga pastikan akun `organizer` biasa TIDAK BISA akses endpoint `/admin/*` sama sekali (return 403).

---

## Backlog (Phase 2 project, JANGAN dikerjakan dulu di MVP)

- [ ] Workforce/Gate 2 endpoints (Engine Operate)
- [ ] CRM & audience segmentation endpoints
- [ ] Marketing attribution (UTM, pixel tracking aggregation)
- [ ] Sponsor dashboard endpoints
- [ ] Refund automation
- [ ] Multi-organizer settlement payout otomatis

---

## Checklist Sebelum Dianggap "MVP Jalan"

- [x] Semua endpoint di Fase 0–2 sudah ada dan sesuai `API_CONTRACT.md`
- [x] Load test checkout endpoint (concurrent request) tidak menghasilkan overselling (dilengkapi `SELECT FOR UPDATE` pessimistic lock)
- [x] Ada seed script untuk data dummy (event + ticket category) supaya FE/Mobile bisa langsung develop tanpa nunggu isi data manual (`prisma/seed.ts`)
- [x] Swagger/OpenAPI docs ter-generate otomatis dari NestJS decorators di `/docs` (memudahkan FE & Mobile ngecek endpoint tanpa buka kode BE)
