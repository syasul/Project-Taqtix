# TAQtix Backend — TASK_ADDENDUM_4.md (Integrasi Payment Gateway DOKU)

> Baca `../docs/DOKU_PAYMENT_INTEGRATION.md` dulu — SEMUA detail teknis (signature, endpoint, format request/response, notifikasi) ada di sana. File ini fokus ke breakdown task implementasi.

---

## FASE II — Setup Modul Doku

### II.1 — Struktur File
```text
src/
  modules/
    payments/
      doku/
        doku.service.ts         # generate signature, call API create payment, verify notification
        doku.config.ts          # baca env var, tentukan base URL sandbox/production
        doku-signature.util.ts  # fungsi generateSignature() & verifySignature() murni, gampang di-unit-test terpisah
      payments.controller.ts    # endpoint /payments/webhook/doku
      payments.service.ts       # logic update Order/Payment/Ticket (yang sudah ada dari TASK.md Fase 1)
```

- [x] Buat `doku-signature.util.ts` — HANYA berisi fungsi murni (`pure function`) untuk `generateSignature()` & `verifySignature()`, TIDAK bergantung ke NestJS DI/service lain. Ini supaya gampang di-unit-test dengan input/output yang predictable (bikin test case dengan nilai contoh dari dokumentasi resmi, cocokkan hasilnya)
- [x] Tulis unit test untuk `generateSignature()` menggunakan CONTOH dari dokumentasi resmi Doku (Client-Id, Request-Id, Timestamp, body tertentu → signature tertentu) — kalau hasil fungsi kamu TIDAK cocok dengan contoh di dokumentasi, ada yang salah di implementasi, JANGAN lanjut ke integrasi sandbox sebelum unit test ini hijau

### II.2 — Environment & Config
- [x] Tambah ke `.env`: `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENV` (sandbox/production)
- [x] `doku.config.ts` — resolve base URL otomatis berdasarkan `DOKU_ENV`:
  ```typescript
  export const DOKU_BASE_URL = process.env.DOKU_ENV === 'production' ? 'https://api.doku.com' : 'https://api-sandbox.doku.com';
  ```
- [x] Verifikasi dulu ke tim/dashboard Doku: apakah kredensial yang ada di screenshot kamu itu SANDBOX atau PRODUCTION. Kalau ternyata production, JANGAN dipakai untuk development — daftar dulu akses sandbox terpisah (biasanya ada toggle environment di dashboard Doku, atau kredensial sandbox didapat dari proses registrasi berbeda)

---

## FASE III — Create Payment (Saat Order Dibuat)

Modifikasi flow `POST /orders` yang sudah ada dari TASK.md Fase 1:
- [x] Setelah Order berhasil dibuat dengan status `pending` (dan quota berhasil di-lock), panggil `DokuService.createPayment(order)`:
  - [x] Generate Request-Id baru (UUID v4)
  - [x] Generate Request-Timestamp (ISO8601 UTC, ingat kurangi 7 jam dari WIB kalau hitung manual — LEBIH AMAN pakai `new Date().toISOString()` yang otomatis UTC, jangan hitung offset manual)
  - [x] Build request body sesuai format di `DOKU_PAYMENT_INTEGRATION.md` section 4 — `order.invoice_number` pakai format `TAQTIX-ORD-{order.id}`, `payment.payment_due_date: 10`
  - [x] Serialize body SEKALI ke variabel string, pakai variabel yang SAMA untuk hitung Digest dan untuk kirim sebagai request body (lihat catatan penting di dokumen referensi)
  - [x] Generate signature, kirim POST request ke `{DOKU_BASE_URL}/checkout/v1/payment`
  - [x] Simpan `response.payment.token_id` ke `Payment.externalId`
  - [x] Update `Order.expiredAt` pakai `response.payment.expired_date` dari Doku (parse format `yyyyMMddHHmmss` UTC+7), BUKAN hitung `now + 10 menit` secara terpisah di kode TAQtix — supaya expiry di 2 sistem selalu sinkron persis
  - [x] Return `response.payment.url` ke FE sebagai bagian dari response `POST /orders`
  - [x] Update kontrak response `POST /orders` (di `api_contract.md`) — tambah field `paymentUrl` di response body supaya FE tau field ini ada
  - [x] Error handling: kalau request ke Doku gagal (network error, response 4xx/5xx), rollback — kembalikan quota yang sudah di-lock, set `Order.status` jadi failed/cancelled, JANGAN biarkan Order menggantung pending tanpa `paymentUrl` yang valid

**Definition of done**: `POST /orders` dari Postman/Thunder Client, response berisi `paymentUrl` yang valid, buka di browser, halaman checkout Doku (sandbox) muncul dengan jumlah yang benar.

---

## FASE IV — Terima & Verifikasi Notifikasi (Webhook)

### IV.1 — Setup Raw Body Capture
- [x] Di `main.ts`, aktifkan raw body capture: `const app = await NestFactory.create(AppModule, { rawBody: true });`
- [x] Di controller endpoint webhook, akses raw body via `req.rawBody` (Buffer), convert ke string SEBELUM proses — JANGAN pakai `JSON.stringify(req.body)` untuk verifikasi digest (lihat penjelasan kenapa di dokumen referensi section 6)

### IV.2 — Endpoint Webhook
- [x] `POST /payments/webhook/doku`:
  - [x] Ambil header `Client-Id`, `Request-Id`, `Request-Timestamp`, `Signature`
  - [x] Hitung ulang signature pakai raw body + `Request-Target: /payments/webhook/doku`
  - [x] Bandingkan dengan header `Signature` — kalau tidak cocok, return 401, JANGAN proses APAPUN, log kejadian ini sebagai security event
  - [x] Kalau signature valid, parse body, ambil `order.invoice_number` → extract `orderId` dari format `TAQTIX-ORD-{orderId}`
  - [x] Cari Order di database, cocokkan `order.amount` dari notifikasi dengan `Order.totalAmount` di DB — kalau beda, JANGAN proses, log sebagai anomali untuk investigasi manual
  - [x] Cek idempotency: kalau `Order.status` SUDAH `"paid"`, langsung return 200 tanpa proses ulang
  - [x] Mapping `transaction.status` sesuai tabel di dokumen referensi section 7:
    - `SUCCESS` → jalankan flow yang SAMA dengan payment success di TASK.md Fase 1 (generate Ticket+QR, trigger notifikasi WA/email, dst)
    - `FAILED`/`PENDING` → update `Payment.status` saja, JANGAN ubah `Order.status`
    - `EXPIRED` → jalankan flow auto-expire (kembalikan quota)
  - [x] Return 200 di akhir (setelah proses berhasil ATAU setelah keputusan "tidak perlu diproses lebih lanjut" seperti kasus sudah paid)
  - [x] Endpoint ini DIKECUALIKAN dari rate limiting berbasis IP biasa (`@SkipThrottle()`)

**Definition of done**: Simulasi pembayaran lewat sandbox Doku → webhook diterima → signature valid → Order berubah jadi paid → tiket ter-generate. Kirim ulang notifikasi yang SAMA 2x → yang kedua di-skip tanpa generate tiket dobel.

---

## FASE V — Fallback: Check Status Manual

- [x] Scheduled job (cron, jalan tiap 3-5 menit): query semua Order dengan status `pending` yang `expiredAt`-nya dalam 15 menit terakhir
- [x] Untuk tiap order itu, panggil `GET {DOKU_BASE_URL}/orders/v1/status/{invoice_number}` (signature tanpa Digest, sesuai section 8 dokumen referensi)
- [x] Kalau hasil status `SUCCESS` tapi Order di DB masih `pending` → berarti webhook gagal sampai, proses manual dengan flow yang sama seperti section IV.2 (idempotent, aman dipanggil kapan saja)

**Definition of done**: Jaring pengaman jika webhook gagal terkirim karena alasan jaringan — job ini tidak menduplikasi proses order yang sudah diselesaikan via webhook.

---

## FASE VI — Testing End-to-End

- [x] Test di sandbox Doku pakai payment simulator resmi untuk simulasi berbagai channel (VA, e-wallet, QRIS)
- [x] Test skenario: buyer buka checkout, timer 10 menit habis TANPA bayar → Order otomatis expired, quota kembali
- [x] Test skenario: buyer bayar pakai 1 metode gagal, lalu ganti metode di halaman Checkout Doku yang sama, akhirnya sukses → Order TIDAK ke-cancel di tengah jalan
- [x] Test signature verification dengan payload yang SENGAJA dimanipulasi → ditolak 401
