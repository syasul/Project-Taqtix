# TAQtix Backend — TASK_TESTING.md

> Baca `../shared/TESTING_STRATEGY.md` dulu. File ini breakdown implementasi testing untuk BE, disusun berdasarkan prioritas di strategi tersebut.

---

## Setup Awal

- [ ] Install: `@nestjs/testing`, `jest`, `supertest`, `@types/supertest`
- [ ] Setup `docker-compose.test.yml` — Postgres + Redis instance TERPISAH untuk testing (port beda dari development, misal `5433` dan `6380`)
- [ ] Setup `.env.test` dengan `DATABASE_URL` mengarah ke DB test, `DOKU_ENV=sandbox`
- [ ] Script `package.json`:
  ```json
  {
    "scripts": {
      "test": "jest",
      "test:e2e": "jest --config ./test/jest-e2e.json",
      "test:watch": "jest --watch",
      "pretest:e2e": "prisma migrate deploy --schema=./prisma/schema.prisma"
    }
  }
  ```
- [ ] Buat helper `test/utils/seed-test-data.ts` — factory function untuk bikin data test konsisten (createTestOrganizer, createTestEvent, createTestTicketCategory, dst)
- [ ] Buat helper `test/utils/db-cleanup.ts` — truncate semua table antar test suite (`beforeEach`/`afterEach`), supaya test tidak saling mempengaruhi

---

## PRIORITAS 1 — Unit & Integration Test: Uang & Inventory

### 1.1 — Anti Double-Booking (PALING KRITIKAL)
- [ ] Unit test: locking mechanism di level function — mock concurrent call ke fungsi reserve quota, pastikan hasil akhir `sold` tidak melebihi `quota`
- [ ] Integration test dengan Supertest:
  ```typescript
  it('should not oversell when 20 concurrent requests hit a category with quota 10', async () => {
    const category = await createTestTicketCategory({ quota: 10, sold: 0 });
    const requests = Array.from({ length: 20 }, () =>
      request(app.getHttpServer())
        .post('/orders')
        .send({ eventId: category.eventId, items: [{ ticketCategoryId: category.id, qty: 1 }] })
    );
    const results = await Promise.all(requests);
    const successCount = results.filter(r => r.status === 201).length;
    expect(successCount).toBe(10); // hanya 10 yang berhasil, sisanya TICKET_SOLD_OUT
    const updatedCategory = await getTicketCategory(category.id);
    expect(updatedCategory.sold).toBe(10); // tidak lebih dari quota
  });
  ```
- [ ] Ulangi pola test yang sama untuk: `EventFacility.sold` vs `quota`, `Voucher.discountPoolUsed` vs `discountPoolLimit`, `DoorprizeItem.remainingQuantity`

### 1.2 — Idempotency Checkout
- [ ] Test: kirim `POST /orders` 5x dengan `Idempotency-Key` yang SAMA secara paralel (`Promise.all`) → hanya 1 `Order` yang benar-benar terbentuk di DB, ke-4 response lain identik dengan response pertama
- [ ] Test: kirim `POST /orders` dengan `Idempotency-Key` yang sama tapi body BERBEDA → tentukan perilaku (return response pertama tetap, atau reject — pastikan konsisten dengan desain di `SPAM_CLICK_AND_MEMORY_BUDGET.md`)
- [ ] Test: request tanpa header `Idempotency-Key` sama sekali untuk endpoint yang mewajibkannya → harus reject `400 MISSING_IDEMPOTENCY_KEY`

### 1.3 — Idempotency Webhook Doku
- [ ] Test: kirim notifikasi webhook Doku dengan `transaction.status: SUCCESS` untuk order yang sama 2x berturut-turut → `Ticket` hanya ter-generate 1x, `Order.status` tetap `paid` (bukan error di request kedua)
- [ ] Test: notifikasi dengan `order.amount` yang TIDAK COCOK dengan `Order.totalAmount` di DB → ditolak, tidak diproses sebagai pembayaran valid, ada log anomali

### 1.4 — Signature Doku
- [ ] Unit test `generateSignature()` pakai NILAI CONTOH PERSIS dari dokumentasi resmi Doku (`Client-Id`, `Request-Id`, `Request-Timestamp`, body tertentu) → hasil harus SAMA PERSIS dengan signature contoh di dokumentasi. Kalau tidak cocok, ada bug implementasi yang HARUS diperbaiki sebelum lanjut ke test lain
- [ ] Unit test `verifySignature()` — signature valid diterima, signature yang di-tamper (ubah 1 karakter) ditolak
- [ ] Integration test webhook: body dengan `order.amount` diubah TAPI signature tidak di-update ulang → endpoint harus reject 401

### 1.5 — Kalkulasi Harga di BE (Tidak Percaya FE)
- [ ] Test: kirim `POST /orders` dengan `totalAmount` yang dimanipulasi (lebih kecil dari harga sebenarnya) → BE harus IGNORE nilai itu dan hitung ulang dari `TicketCategory.price` × qty di database, response order yang tersimpan pakai angka yang BE hitung sendiri
- [ ] Test yang sama untuk voucher discount — kirim `discountAmount` palsu, pastikan BE hitung ulang dari `Voucher.discountValue` bukan menerima begitu saja

---

## PRIORITAS 2 — Keamanan & Isolasi Data

### 2.1 — Permission Matrix (Team Access)
- [ ] Buat test parametrized untuk kombinasi role × resource paling kritikal (minimal, dari `API_CONTRACT_ADDENDUM.md` §1):
  ```typescript
  const testCases = [
    { role: 'finance', endpoint: 'POST /organizer/events', expectedStatus: 403 },
    { role: 'marketing', endpoint: 'PATCH /organizer/settings/payment', expectedStatus: 403 },
    { role: 'viewer', endpoint: 'POST /organizer/vouchers', expectedStatus: 403 },
    { role: 'owner', endpoint: 'DELETE /organizer/team/:id', expectedStatus: 200 },
    { role: 'admin', endpoint: 'DELETE /organizer/team/:id', expectedStatus: 403 }, // hanya owner
  ];
  ```
- [ ] Test khusus: coba downgrade role satu-satunya `owner` → harus ditolak `LAST_OWNER_CANNOT_DEMOTE`

### 2.2 — Multi-Tenant Isolation
- [ ] Buat 2 organizer test (`orgA`, `orgB`) dengan event & data masing-masing
- [ ] Login sebagai member `orgA`, coba akses SEMUA endpoint `/organizer/*` dengan ID milik `orgB` (event ID, voucher ID, workforce ID, dst) → SEMUA harus return 404 (bukan data orgB yang bocor), bukan 403 (403 justru bocorkan informasi "resource ini ada tapi bukan milikmu")
- [ ] Ini WAJIB dites untuk SETIAP endpoint yang scoped ke organizer — buat 1 test generik yang loop semua endpoint kalau memungkinkan, atau checklist manual per endpoint minimal sekali

### 2.3 — Rate Limiting
- [ ] Test: kirim request beruntun ke endpoint checkout melebihi limit yang diset → request ke-N+1 harus dapat `429` dengan header `Retry-After`
- [ ] Test: endpoint auth/login dengan 6 percobaan gagal beruntun → percobaan ke-6 harus dapat `429`, bukan terus diproses sebagai percobaan login biasa

### 2.4 — Validasi Input
- [ ] Test: kirim field asing yang tidak diminta di body → request ditolak (`forbidNonWhitelisted`)
- [ ] Test: kirim NIK dengan format salah (bukan 16 digit) → ditolak dengan pesan jelas
- [ ] Test: kirim `limit=999999` di query pagination → BE cap ke max yang ditentukan (misal 100), bukan diproses apa adanya

### 2.5 — QR yang Di-block
- [ ] Test: tiket dengan `isBlocked: true` di-scan via `/gate/scan` → ditolak `TICKET_BLOCKED`, bukan diproses sebagai valid

---

## PRIORITAS 3 — Operasional Event Day

### 3.1 — Auto-Expire Order
- [ ] Test: `Order` dengan `expiredAt` di masa lalu, jalankan scheduled job auto-expire → status jadi `expired`, quota `TicketCategory.sold` berkurang kembali sesuai qty order tersebut

### 3.2 — Transfer Tiket
- [ ] Test: request transfer tiket → `Ticket.status` langsung jadi `transfer_pending`
- [ ] Test: scan QR LAMA saat status masih `transfer_pending` → HARUS ditolak (bukan diterima sebagai valid)
- [ ] Test: confirm transfer → `qrPayload` berubah jadi payload baru, QR lama permanen tidak valid meski dicoba scan lagi setelahnya

### 3.3 — Batch Scan Offline (Sisi BE, Endpoint Batch)
- [ ] Test: kirim `POST /gate/scan/batch` dengan array berisi scan yang SAMA tiketnya 2x (simulasi 2 device offline scan tiket sama) → response harus tandai salah satu sebagai konflik, hanya 1 yang final `checked_in`

---

## PRIORITAS 4 — Alur Fungsional (E2E dengan Supertest)

- [ ] E2E test alur checkout lengkap: create event → publish → approve (admin) → buyer checkout → payment webhook sukses → ticket ter-generate → scan tiket di gate → status jadi `checked_in`
- [ ] E2E test alur affiliate: organizer buat `AffiliateCodeTemplate` → affiliate generate kode → buyer checkout pakai kode itu → order paid → komisi affiliate ter-update → notifikasi organizer muncul
- [ ] CRUD dasar tiap modul utama (event, ticket category) — cukup 1 test happy path + 1 test validation error per endpoint, tidak perlu exhaustive di tahap ini

---

## Load Testing (Terpisah dari Test Suite CI Biasa)

- [ ] Buat script k6 di folder `test/load/checkout.js` — simulasi N virtual user hit checkout bersamaan ke 1 event dengan quota terbatas
- [ ] Jalankan MANUAL sebelum tiap event nyata besar (bukan bagian dari CI otomatis, karena butuh environment yang mirip production dan bisa memakan resource besar)
- [ ] Target: sistem tidak oversell DAN response time tetap wajar (tentukan threshold, misal p95 < 2 detik) saat traffic sesuai prediksi jumlah buyer event tersebut

---

## Definition of Done Keseluruhan

- [ ] Semua test Prioritas 1 & 2 hijau sebelum event alpha (Taqwa Movement) dijalankan
- [ ] CI pipeline jalan otomatis di tiap PR, block merge kalau ada test yang gagal
- [ ] Load test sudah dijalankan MINIMAL sekali dengan skenario mendekati traffic asli sebelum go-live pertama
