# TAQtix Backend — TASK_ADDENDUM_2.md

> Tambahan dari `TASK.md` dan `TASK_ADDENDUM.md`. Baca `../shared/API_CONTRACT_ADDENDUM_2.md` dulu — semua bentuk data & endpoint di sini WAJIB persis sesuai kontrak itu.

---

## FASE J — Voucher (Migrasi dari Promo Code)

- [x] Buat model `Voucher` baru di Prisma (field persis section 1 kontrak addendum 2)
- [x] Migration script: pindahkan data promo code lama (kalau sudah ada dari `TASK.md` Fase 1) jadi `Voucher` dengan `eventId` terisi (scoped ke event asalnya)
- [x] `POST /organizer/vouchers` — validasi: kalau `eventId` diisi, harus event milik organizer yang sama; kalau `eventId` null, voucher berlaku org-wide (atau dibatasi `applicableEventIds` kalau diisi)
- [x] `GET /organizer/vouchers?eventId=` — filter opsional
- [x] `PATCH /organizer/vouchers/:id`, `POST /organizer/vouchers/:id/deactivate`
- [x] **Update endpoint lama** `POST /orders/validate-promo` — ganti query dari tabel promo code lama (kalau ada) ke `Voucher`. Cek: `status active`, `validFrom <= now <= validUntil`, `usageCount < usageLimit` (kalau ada limit), `eventId` cocok atau termasuk `applicableEventIds`
- [x] Guard: create/edit voucher hanya role `owner`/`admin`/`marketing` (sesuai permission matrix di `API_CONTRACT_ADDENDUM.md`)

**Definition of done:** Voucher yang dibuat tanpa `eventId` bisa dipakai di beberapa event berbeda milik organizer yang sama, tervalidasi benar saat checkout.

---

## FASE K — Cash Management

- [x] Model `CashTransaction`
- [x] `POST /organizer/events/:id/cash` — input manual
- [x] `GET /organizer/events/:id/cash` — list + `meta.totalCashIn`
- [x] `GET /organizer/cash/summary` — aggregate SUM per event, group by event, untuk halaman org-level
- [x] Saat POS transaction (Fase P) dengan `paymentMethod: cash` sukses, otomatis buat `CashTransaction` terkait (`relatedPosTransactionId` terisi) — jangan bikin organizer input manual 2x untuk transaksi yang sama

**Definition of done:** Total di halaman Cash org-level = SUM semua Cash lintas event, dan otomatis sinkron dengan transaksi POS cash tanpa duplikasi input.

---

## FASE L — Token Generator

- [x] Model `ApiToken`
- [x] `POST /organizer/api-tokens`:
  - [x] Generate token random (`taq_live_` + 32 karakter hex)
  - [x] Simpan HASH-nya saja (bcrypt/sha256) di DB, JANGAN simpan plaintext
  - [x] Response SEKALI ini return token asli lengkap, response selanjutnya (GET list) cuma `tokenPreview` (8 karakter terakhir)
  - [x] Guard: hanya `owner`
- [x] `GET /organizer/api-tokens`, `POST /organizer/api-tokens/:id/revoke`
- [x] Buat `ApiKeyGuard` middleware terpisah: baca header `X-API-Key`, hash & cocokkan ke DB, cek `revokedAt` null
- [x] Terapkan `ApiKeyGuard` ke minimal 3 endpoint read-only untuk MVP: `GET /api/v1/events` (list event milik organizer), `GET /api/v1/orders`, `GET /api/v1/attendance` — endpoint versi publik-API ini terpisah dari endpoint dashboard internal (prefix `/api/v1/` beda dari `/organizer/`)
- [x] Update `lastUsedAt` tiap kali token dipakai (fire-and-forget update, jangan blocking response)

**Definition of done:** Organizer generate token, pakai di request eksternal (test pakai curl/Postman dengan header `X-API-Key`), berhasil ambil data read-only miliknya sendiri saja.

---

## FASE M — Formulir Tambahan (Custom Form Builder)

- [x] Model `CustomFormField`
- [x] `POST/PATCH/DELETE /organizer/events/:id/custom-fields`
- [x] `PATCH /organizer/events/:id/custom-fields/reorder`
- [x] Update `GET /events/:slug` — sertakan `customFields[]` (sorted by `order`)
- [x] Update `POST /orders` — terima `customFieldAnswers` per item:
  - [x] Validasi semua field `required: true` terisi, kalau tidak → `VALIDATION_ERROR` dengan detail field mana yang kosong
  - [x] Validasi `fieldType: "dropdown"` — jawaban harus salah satu dari `options`
- [x] Update export orders (Fase U) — sertakan jawaban custom field sebagai kolom tambahan di CSV

**Definition of done:** Organizer bisa tambah field custom (misal "Ukuran Baju"), field itu muncul di checkout FE, jawabannya tersimpan dan bisa di-export.

---

## FASE N — Fasilitas Event

- [x] Model `EventFacility`
- [x] `POST/GET/PATCH /organizer/events/:id/facilities`
- [x] Update `GET /events/:slug` — sertakan `facilities[]`
- [x] Update `POST /orders`:
  - [x] Terima `facilities[]` per `OrderItem`
  - [x] Validasi `applicableTicketCategoryIds` — tolak kalau facility tidak berlaku untuk kategori tiket yang dipilih
  - [x] Tambahkan total harga facility ke `Order.totalAmount`
  - [x] Kurangi `EventFacility.sold` dengan locking mechanism SAMA seperti ticket quota (reuse pattern dari `TASK.md` Fase 1 — row lock/optimistic locking)

**Definition of done:** Beli tiket + tambah "Merchandise Bundle" sebagai addon, total harga benar, quota facility berkurang, tidak overselling.

---

## FASE O — Line Up

- [x] Model `LineUpItem`
- [x] CRUD lengkap + reorder endpoint
- [x] Update `GET /events/:slug` — sertakan `lineup[]`

**Definition of done:** Data lineup muncul di response public event, siap ditampilkan FE di landing page.

---

## FASE P — Transfer Tiket

- [x] Model `TicketTransfer`
- [x] `POST /tickets/:id/transfer`:
  - [x] Verifikasi requester adalah pemilik tiket (cek lewat email/token akses e-ticket, bukan perlu login penuh)
  - [x] Cek `event.allowTicketTransfer` — tolak kalau organizer disable fitur ini
  - [x] Set `Ticket.status` jadi semacam status sementara "transfer_pending" (tambah value baru di enum status Ticket) — **QR lama harus langsung tidak valid di titik ini**, bukan nanti
  - [x] Generate `requestToken`, kirim link konfirmasi ke `toEmail`/`toPhone` via WA/email
- [x] `POST /tickets/transfer/:requestToken/confirm`:
  - [x] Update data attendee di `OrderItem` (nama/email/phone baru)
  - [x] Regenerate `qrPayload` baru untuk `Ticket` ini (ticketId sama, payload beda)
  - [x] Set `Ticket.status` balik ke `"valid"`, `TicketTransfer.status = "completed"`
- [x] `POST /tickets/transfer/:requestToken/decline` — batalkan, `Ticket.status` balik ke `"valid"` dengan data attendee ORIGINAL (tidak jadi pindah)
- [x] Scheduled job: auto-expire transfer request yang tidak dikonfirmasi dalam 24 jam, balikin status tiket ke `"valid"` dengan attendee original

**Definition of done:** Test skenario: request transfer → coba scan QR lama saat status `transfer_pending` → harus ditolak (`QR_INVALID` atau error baru khusus). Confirm transfer → QR baru yang valid, QR lama permanen tidak bisa dipakai lagi.

---

## FASE Q — Pengunjung Nonaktif (Block Ticket)

- [x] Tambah field `isBlocked`, `blockedReason`, `blockedBy`, `blockedAt` ke model `Ticket`
- [x] `POST /organizer/tickets/:id/block`, `POST /organizer/tickets/:id/unblock`
- [x] `GET /organizer/events/:id/blocked-visitors`
- [x] Update `/gate/scan` (endpoint lama dari `TASK.md` Fase 2) — tambah pengecekan `isBlocked` SEBELUM cek status lain, return error baru `TICKET_BLOCKED` (403) kalau true

**Definition of done:** Tiket yang di-block tidak bisa check-in di gate, gate staff dapat pesan jelas kenapa ditolak (bukan cuma "invalid").

---

## FASE R — Point of Sales (POS)

- [x] Model `PosTransaction`
- [x] `POST /organizer/events/:id/pos/transaction`:
  - [x] Terima array items (ticket category dan/atau facility)
  - [x] Reuse locking mechanism yang sama untuk kurangi quota (Fase 1 `TASK.md` + Fase N di sini)
  - [x] Generate `Ticket` + QR langsung dengan status `paid` (skip flow payment gateway kalau `paymentMethod: cash`)
  - [x] Kalau `paymentMethod: cash` → trigger otomatis buat `CashTransaction` (Fase K)
  - [x] Kalau `paymentMethod: qris` → generate QRIS lewat payment gateway yang sudah terintegrasi (opsional MVP, boleh mulai dari cash-only)
- [x] `GET /organizer/events/:id/pos/transactions`, `GET /organizer/events/:id/pos/summary`
- [x] Guard: siapa yang boleh proses transaksi POS? Tambahkan role/permission baru `cashier` di `OrganizerMember` ATAU izinkan role manapun yang di-assign sebagai staff event ini (koordinasikan dengan FE soal siapa yang login ke device POS di venue)

**Definition of done:** Transaksi cash di POS langsung menghasilkan tiket valid dengan QR, dan otomatis tercatat di Cash module tanpa input dobel.

---

## FASE S — Doorprize

- [x] Model `DoorprizeItem`, `DoorprizeWinner`
- [x] `POST /organizer/events/:id/doorprize`
- [x] `POST /organizer/events/:id/doorprize/:itemId/draw`:
  - [x] Query semua `Ticket` dengan `status: "checked_in"` untuk event ini
  - [x] Exclude yang sudah pernah menang (kalau `excludeWinnersFromPreviousDraws: true`, cek ke semua `DoorprizeWinner` event ini)
  - [x] Random pick 1 (pakai random function DB-level atau random di application-level, pastikan benar-benar acak bukan selalu row pertama)
  - [x] Kurangi `remainingQuantity`, catat ke `DoorprizeWinner`
- [x] `GET /organizer/events/:id/doorprize/winners`

**Definition of done:** Tombol undi menghasilkan 1 pemenang berbeda tiap kali dipanggil, tidak pernah pilih orang yang sama 2x untuk hadiah yang sama.

---

## FASE T — Broadcast Email

- [x] Setup email provider (SendGrid/Mailgun/SES — pilih 1, catat pilihan di `.env` dan dokumentasi)
- [x] Update `POST /organizer/segments/:id/broadcast` — terima `channel: "whatsapp" | "email"`, route ke job processor yang sesuai
- [x] Buat template HTML email dasar (logo organizer dari `Organizer` settings, placeholder `{name}`)
- [x] Rate limit terpisah dari WA (email provider biasanya limit beda, cek dokumentasi provider yang dipilih)

**Definition of done:** Broadcast bisa pilih channel WA atau email dari endpoint yang sama, keduanya melalui job queue dengan rate limit masing-masing.

---

## FASE U — Rekap Data (Export)

- [x] `GET /organizer/events/:id/export/orders?format=csv`
- [x] `GET /organizer/events/:id/export/attendance?format=csv`
- [x] `GET /organizer/events/:id/export/financial-summary?format=csv`
- [x] `GET /organizer/export/cross-event-summary?format=csv&from=&to=`
- [x] Untuk data > 1000 baris: proses di background job (BullMQ), generate file, simpan ke folder lokal khusus export (terpisah dari folder upload gambar, misal `/var/www/taqtix-uploads/exports/`), response `{ downloadUrl, expiresAt }` — FE polling status job sampai selesai
- [x] **WAJIB ada scheduled job pembersih** (cron, jalan tiap beberapa jam) yang hapus file export yang sudah lewat `expiresAt` — karena tidak ada auto-expiry seperti S3 presigned URL, file lokal akan menumpuk terus dan menghabiskan disk kalau tidak dibersihkan manual
- [x] Untuk data kecil: boleh generate & return langsung sinkron (`Content-Type: text/csv` langsung di response)

**Definition of done:** Export ribuan order tidak bikin request timeout — pakai background job dan polling.

---

## FASE V — Ubah Password

- [x] `POST /auth/change-password` — berlaku untuk semua role yang punya password (organizer member, partner kalau sudah set password, admin)
- [x] Validasi `currentPassword` cocok sebelum update
- [x] Invalidate semua refresh token lain milik user ini setelah ganti password (force re-login di device lain, standar keamanan)

**Definition of done:** Ganti password berhasil, sesi di device lain otomatis ter-logout.

---

## Urutan Pengerjaan yang Disarankan

```
FASE J (Voucher) — migrasi dulu dari promo code lama, banyak fitur lain bergantung
    ↓
FASE M (Formulir Tambahan) + FASE N (Fasilitas Event) — sama-sama ubah struktur checkout
    ↓
FASE Q (Block Visitor) — murah, keamanan penting sebelum POS jalan rame
    ↓
FASE R (POS) + FASE K (Cash) — dikerjakan bersamaan, saling terhubung
    ↓
FASE P (Transfer Tiket) — kompleks karena urusan invalidasi QR, kerjakan setelah checkout inti stabil
    ↓
FASE S (Doorprize) + FASE O (Line Up) — fitur pelengkap, tidak saling bergantung, kerjakan kapan saja
    ↓
FASE T (Broadcast Email) + FASE U (Export) — pelengkap fitur yang sudah ada
    ↓
FASE L (Token Generator) + FASE V (Ubah Password) — housekeeping, paling akhir
    ↓
Cetak Tiket Gelang (lihat API_CONTRACT_ADDENDUM_2.md section 4) — prioritas paling rendah, opsional
```
