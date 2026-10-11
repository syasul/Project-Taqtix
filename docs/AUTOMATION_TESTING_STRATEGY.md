# TAQtix — Automation Testing Strategy

> Dokumen ini konsolidasi SEMUA skenario test kritis yang sudah disebut tersebar di berbagai file sebelumnya (`TASK.md`, addendum, security docs) jadi 1 strategi testing yang terorganisir. Baca ini dulu sebelum masuk ke task testing per project.

---

## 1. Test Pyramid untuk TAQtix

```
        /\
       /E2E\          <- Sedikit, tapi cover alur paling kritis (checkout end-to-end)
      /------\
     /Integration\    <- Sedang, test tiap endpoint dengan DB beneran (test DB terpisah)
    /------------\
   /   Unit Test   \  <- Banyak, cepat, test logic murni (signature, kalkulasi, validasi)
  /------------------\
```

**Prinsip alokasi effort:** jangan coba 100% coverage semua endpoint dulu. Prioritaskan dari yang paling berisiko finansial/keamanan dulu (lihat section 2), baru turun ke yang lebih ringan.

---

## 2. Prioritas Testing (Urutan Mengerjakan)

Ini diambil dari SEMUA "Definition of done" yang sudah disebut di file-file sebelumnya, dikelompokkan jadi 1 daftar prioritas:

### Prioritas 1 — Uang & Inventory (Paling Kritikal)
- Anti double-booking saat concurrent request ke ticket category yang sama (`be/TASK.md` Fase 1)
- Idempotency checkout — spam klik tidak menghasilkan order duplikat (`SPAM_CLICK_AND_MEMORY_BUDGET.md`)
- Idempotency webhook Doku — notifikasi yang sama 2x tidak generate tiket dobel (`be/TASK_ADDENDUM_4.md` Fase IV)
- Locking mechanism direplikasi ke SEMUA resource berbatas: discount pool voucher, quota facility, quota doorprize (`SECURITY_HARDENING_ADDENDUM.md` §4)
- Signature Doku (generate & verify) cocok dengan contoh resmi dokumentasi (`be/TASK_ADDENDUM_4.md` Fase II.1)
- Kalkulasi total harga SELALU dari BE, bukan percaya dari FE (`RISKS_AND_VULNERABILITIES.md`)

### Prioritas 2 — Keamanan & Isolasi Data
- Permission matrix Team Access — tiap role hanya bisa akses resource yang diizinkan (`API_CONTRACT_ADDENDUM.md` §1)
- Multi-tenant isolation — organizer A tidak bisa akses data organizer B
- Rate limiting benar-benar aktif per kategori endpoint (`be/TASK_ADDENDUM_3.md` Fase HH.2)
- Validasi input menolak payload yang tidak sesuai (field asing, tipe salah, panjang berlebih)
- QR yang di-block (`isBlocked`) ditolak saat scan gate

### Prioritas 3 — Operasional Event Day
- Offline scanner: scan saat wifi mati, sync setelah online, tidak ada duplikasi (`mobile/TASK.md` Fase 2)
- Konflik 2 device scan tiket sama saat sama-sama offline — salah satu harus ditandai konflik saat sync
- Auto-expire order yang lewat `expiredAt`, quota dikembalikan
- Transfer tiket — QR lama invalid begitu status `transfer_pending`, bukan setelah `completed` (`API_CONTRACT_ADDENDUM_3.md` §... transfer tiket)

### Prioritas 4 — Alur Fungsional Umum
- CRUD dasar tiap modul (event, ticket category, voucher, dst)
- Alur checkout end-to-end (buka landing page → checkout → bayar sandbox → dapat e-ticket)
- Dashboard analytics menampilkan angka yang benar dari data test yang diketahui

---

## 3. Tools per Project

| Project | Unit Test | Integration Test | E2E Test |
|---|---|---|---|
| **BE** (NestJS) | Jest (built-in NestJS testing module) | Jest + Supertest, database test terpisah (docker-compose test env) | Supertest untuk alur multi-endpoint (checkout → payment → ticket) |
| **fe-web** (Next.js) | Jest + React Testing Library (untuk komponen/hook kompleks) | — | Playwright (alur buyer & organizer paling kritis) |
| **admin** (Next.js) | Jest + RTL (opsional, lebih sedikit karena less complex logic) | — | Playwright (event approval, banner management) |
| **affiliate** (Next.js) | Jest + RTL (opsional) | — | Playwright (generate kode, lihat dashboard) |
| **mobile** (Flutter) | `flutter_test` (widget test) | `integration_test` package (test di device/emulator beneran) | Sama seperti integration test Flutter |
| **Concurrency/Load** | — | k6 atau autocannon (script terpisah, bukan bagian dari test suite CI biasa) | — |

---

## 4. Environment Testing

- [ ] Setup database test TERPISAH dari development (bukan cuma schema beda, tapi instance/container terpisah) — supaya test yang jalan berulang tidak mengotori data development
- [ ] Setup `.env.test` dengan kredensial Doku **sandbox** (jangan pernah test pakai kredensial production)
- [ ] Seed script khusus test — data minimal yang konsisten tiap test run (bukan random), supaya assertion bisa presisi
- [ ] CI pipeline (GitHub Actions atau sejenis): jalankan unit + integration test otomatis tiap push/PR, E2E bisa dijadwalkan terpisah (lebih lambat) atau jalan di PR ke branch utama saja

---

## 5. Yang SENGAJA Tidak Di-automate Dulu (Manual Testing Cukup untuk MVP)

Supaya tidak over-invest waktu ke testing yang ROI-nya rendah di tahap awal:
- UI visual/styling (cukup review manual + screenshot diff kalau nanti sempat)
- Broadcast WA/Email ke jumlah besar (test manual ke <10 penerima dulu, bukan full automation)
- POS hardware/tablet-specific behavior (test manual di device beneran)
- Fitur yang masih di backlog Phase 2/3

---

## Urutan Baca Task Testing per Project

1. `be/TASK_TESTING.md` — paling penting, paling banyak logic kritikal
2. `mobile/TASK_TESTING.md` — offline sync adalah area paling rawan
3. `fe-web/TASK_TESTING.md` — E2E untuk alur buyer yang paling sering dipakai
