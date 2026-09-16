# TAQtix — Integrasi Payment Gateway DOKU (Referensi Teknis Lengkap)

> Sumber: dokumentasi resmi developers.doku.com per September 2026. **Catatan penting:** kredensial di dashboard Doku kamu menampilkan beberapa field (Client ID, Active Secret Key, API Key, DOKU Public Key, Merchant Public Key). Untuk integrasi **Checkout API** (yang direkomendasikan di bawah), yang dipakai HANYA **Client ID** dan **Active Secret Key** — field `DOKU Public Key`/`Merchant Public Key` itu untuk fitur SNAP Direct API (integrasi per-channel/per-bank yang lebih kompleks), TIDAK diperlukan untuk MVP ini. Kalau nanti butuh channel spesifik yang tidak ter-cover Checkout API, baru masuk ke Direct API dan field itu relevan.

---

## 1. Kenapa Pakai Checkout API (Bukan Direct API/SNAP)

Doku punya 2 jalur integrasi:
- **Checkout API** — 1 endpoint, Doku yang handle halaman pembayaran (hosted page), otomatis dapat semua channel yang diaktifkan di akun kamu (kartu, VA semua bank, e-wallet, QRIS). Auth: `Client-Id` + `Secret Key`, signature HMAC-SHA256.
- **Direct API (SNAP)** — integrasi custom per channel, kamu yang bangun UI pembayaran sendiri, butuh flow token B2B dengan key pair asimetris (itu yang butuh `DOKU Public Key`/`Merchant Public Key`).

**Untuk MVP TAQtix, pakai Checkout API.** Lebih cepat diimplementasikan, cukup 1 endpoint dan 1 jenis signature, dan sudah cover semua metode bayar yang realistis dibutuhkan buyer Indonesia.

---

## 2. Environment & Endpoint

```
DOKU_CLIENT_ID=BRN-0283-1788009869793          # dari dashboard, field "Client ID"
DOKU_SECRET_KEY=<Active Secret Key dari dashboard, reveal dulu>
DOKU_BASE_URL_SANDBOX=https://api-sandbox.doku.com
DOKU_BASE_URL_PRODUCTION=https://api.doku.com
DOKU_ENV=sandbox   # ganti ke "production" saat go-live
```

**PENTING:** sandbox dan production punya Client ID/Secret Key BERBEDA. Kredensial di screenshot kamu perlu dicek — pastikan itu kredensial **sandbox** dulu untuk development, jangan pakai kredensial production sampai benar-benar siap go-live (lihat `RISKS_AND_VULNERABILITIES.md` soal environment separation).

---

## 3. Generate Signature (untuk Request KAMU → Doku)

Ini bagian paling gampang salah — ikuti urutan persis.

### Langkah-langkah
1. **Digest** (hanya untuk POST dengan body, SKIP untuk GET):
   ```
   digest = Base64(SHA256(rawJSONBodyString))
   ```
2. **String to Sign** (gabung per baris pakai `\n`, TIDAK ADA `\n` di akhir):
   ```
   Client-Id:{clientId}
   Request-Id:{requestId}
   Request-Timestamp:{timestamp}
   Request-Target:{path}
   Digest:{digest}
   ```
   Untuk GET request, baris `Digest:` DIHILANGKAN SELURUHNYA (bukan dikosongkan, tapi baris itu tidak ada).
3. **Signature**:
   ```
   signature = "HMACSHA256=" + Base64(HMAC_SHA256(secretKey, stringToSign))
   ```

### Detail Tiap Komponen
- **Client-Id**: dari dashboard
- **Request-Id**: string random unik, MAX 128 karakter — pakai UUID v4 (bisa reuse Idempotency Key yang sudah didesain di `SPAM_CLICK_AND_MEMORY_BUDGET.md`, tapi INGAT ini 2 hal beda: Idempotency Key itu konsep internal TAQtix, Request-Id ini spesifik dibaca Doku — boleh sama nilainya, boleh beda, yang penting Request-Id WAJIB unik per request ke Doku)
- **Request-Timestamp**: format ISO8601 UTC+0, contoh `2026-09-17T08:45:42Z`. **Perhatikan:** kalau transaksi terjadi jam 15:45 WIB, timestamp yang dikirim harus `08:45` (WIB dikurangi 7 jam)
- **Request-Target**: PATH SAJA dari endpoint yang dituju, contoh `/checkout/v1/payment` (bukan full URL)

### Contoh Implementasi (Node.js/TypeScript, siap adaptasi ke NestJS service)
```typescript
import { createHash, createHmac, randomUUID } from 'crypto';

function generateDokuSignature(secretKey: string, clientId: string, requestId: string, timestamp: string, requestTarget: string, bodyString?: string): string {
  let stringToSign = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}`;

  if (bodyString) {
    const digest = createHash('sha256').update(bodyString).digest('base64');
    stringToSign += `\nDigest:${digest}`;
  }

  const hmac = createHmac('sha256', secretKey).update(stringToSign).digest('base64');
  return `HMACSHA256=${hmac}`;
}
```

**PENTING SOAL RAW BODY:** `bodyString` yang dipakai untuk hitung digest HARUS PERSIS STRING YANG SAMA yang benar-benar dikirim sebagai body HTTP request. Jangan `JSON.stringify(obj)` dua kali di tempat berbeda (misal sekali untuk hitung digest, sekali lagi saat kirim request) — kalau ada perbedaan urutan key atau spasi sedikit saja, hasil hash beda dan signature jadi salah. **Serialize SEKALI, simpan ke variabel, pakai variabel yang sama untuk digest DAN untuk body request.**

---

## 4. Endpoint: Create Payment (Checkout)

```
POST https://api-sandbox.doku.com/checkout/v1/payment   (sandbox)
POST https://api.doku.com/checkout/v1/payment            (production)
```

### Request Headers
```
Content-Type: application/json
Client-Id: BRN-0283-1788009869793
Request-Id: <uuid>
Request-Timestamp: 2026-09-17T08:45:42Z
Signature: HMACSHA256=<hasil generate signature>
```

### Request Body (yang relevan untuk TAQtix)
```json
{
  "order": {
    "amount": 150000,
    "invoice_number": "TAQTIX-ORD-<orderId>",
    "callback_url": "https://taqtix.id/checkout/success?orderId=<orderId>",
    "callback_url_cancel": "https://taqtix.id/checkout/cancelled?orderId=<orderId>",
    "auto_redirect": true,
    "line_items": [
      { "name": "Tiket Early Bird", "price": 150000, "quantity": 1 }
    ]
  },
  "payment": {
    "payment_due_date": 10
  },
  "customer": {
    "id": "<buyerId atau email>",
    "name": "<nama buyer>",
    "email": "<email buyer>",
    "phone": "<no HP buyer, format 62xxxxxxxxxx>",
    "country": "ID"
  }
}
```

**Catatan field penting:**
- `order.invoice_number` — WAJIB unik, max 64 karakter (**max 30 karakter kalau Credit Card diaktifkan** — cek apakah channel kartu aktif di akun kamu, kalau ya pastikan format invoice number TAQtix tetap di bawah 30 karakter)
- `payment.payment_due_date` — **diisi `10` (menit)**, otomatis konsisten dengan keputusan timer 10 menit yang sudah diputuskan sebelumnya (`API_CONTRACT.md`)
- `order.auto_redirect: true` — supaya buyer otomatis diarahkan ke `callback_url` setelah selesai bayar, sesuai alur checkout yang sudah didesain (bukan `false` yang nampilin halaman hasil transaksi milik Doku)
- `order.callback_url_cancel` — WAJIB kalau nanti pakai Indodana, opsional untuk channel lain tapi tetap baik diisi untuk UX

### Response yang Penting Diambil
```json
{
  "response": {
    "payment": {
      "token_id": "...",
      "url": "https://app-uat.doku.com/checkout/link/...",
      "expired_date": "20260917184542"
    },
    "order": { "session_id": "..." }
  }
}
```
- `payment.url` — ini yang dipakai FE untuk redirect/embed checkout
- `payment.expired_date` — format `yyyyMMddHHmmss` dalam **UTC+7 (WIB)**, PAKAI INI sebagai `Order.expiredAt` di sistem TAQtix (bukan hitung sendiri `now + 10 menit` secara terpisah — biar sinkron persis dengan yang Doku pakai, hindari selisih beberapa detik yang bisa bikin race condition status)

---

## 5. Menampilkan Halaman Pembayaran (Frontend)

Ada 2 opsi:

**Opsi A — Redirect penuh (lebih simpel, direkomendasikan untuk MVP):**
```javascript
window.location.href = response.payment.url;
```

**Opsi B — Embed sebagai popup/modal di halaman checkout sendiri:**
```html
<script src="https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js"></script>
<!-- Production: https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js -->
<script>
  loadJokulCheckout(paymentUrl); // paymentUrl dari response.payment.url
</script>
```
Opsi B kasih pengalaman lebih mulus (tidak ada full page redirect), tapi butuh pastikan `<meta name="viewport">` sudah benar di halaman (sudah standar di Next.js).

---

## 6. Menerima Notifikasi Pembayaran (Webhook)

Ini yang paling kritikal — di sinilah status `Order` benar-benar diupdate jadi `paid`.

### Setup di Dashboard Doku
Set Notification URL di dashboard Doku (Settings/Configuration) ke:
```
https://api.taqtix.id/payments/webhook/doku
```

### Bentuk Notifikasi yang Diterima (contoh untuk Virtual Account)
```json
{
  "service": { "id": "VIRTUAL_ACCOUNT" },
  "acquirer": { "id": "BCA" },
  "channel": { "id": "VIRTUAL_ACCOUNT_BCA" },
  "transaction": {
    "status": "SUCCESS",
    "date": "2026-09-17T08:50:23Z",
    "original_request_id": "<request_id yang dikirim saat create payment>"
  },
  "order": {
    "invoice_number": "TAQTIX-ORD-<orderId>",
    "amount": 150000
  }
}
```
**Field yang WAJIB dibaca:** `transaction.status` (`SUCCESS`/`FAILED`/`PENDING`/`EXPIRED` tergantung channel), `order.invoice_number` (untuk cari `Order` mana yang dimaksud), `order.amount` (**WAJIB dicocokkan** dengan `Order.totalAmount` di database — kalau tidak sama, JANGAN proses, ini indikasi manipulasi/kesalahan data).

### WAJIB Verifikasi Signature Notifikasi Masuk
Sebelum memproses notifikasi APAPUN, verifikasi dulu:
1. Ambil header `Client-Id`, `Request-Id`, `Request-Timestamp`, `Signature` dari request masuk
2. Hitung ulang Digest dari **raw body** yang diterima (lihat catatan raw body di bawah)
3. `Request-Target` = path notification URL kamu sendiri, yaitu `/payments/webhook/doku`
4. Generate signature dengan cara SAMA PERSIS seperti section 3, pakai `Secret Key` yang sama
5. Bandingkan hasilnya dengan header `Signature` yang dikirim Doku — kalau TIDAK COCOK, **TOLAK request** (return 401/403), JANGAN proses sebagai pembayaran valid

**PENTING SOAL RAW BODY DI SISI BE:** Framework HTTP (Express/NestJS) secara default langsung parse body JSON jadi object. Untuk verifikasi digest, kamu butuh STRING MENTAH sebelum di-parse (karena `JSON.stringify(parsedBody)` bisa hasilkan string berbeda dari yang dikirim Doku — beda urutan key, beda spasi). Solusinya: konfigurasi middleware khusus route `/payments/webhook/doku` untuk capture raw body SEBELUM body-parser jalan (di NestJS: `rawBody: true` di `NestFactory.create()`, lalu akses `req.rawBody` di controller khusus endpoint ini).

### Response yang Harus Dikirim Balik
- **HTTP 2xx** (paling simpel: `200`) untuk konfirmasi notifikasi diterima
- Kalau server TAQtix TIDAK merespons 2xx, Doku akan **retry otomatis sampai 9 kali** dengan interval yang makin lama (15 menit → 45 menit → 2 jam → ... → sampai 3 hari terakhir). **Manfaatkan ini**: kalau proses internal (update DB, generate tiket) gagal karena alasan sementara (misal DB sedang down sesaat), cukup return non-2xx dan Doku akan coba lagi otomatis — TAPI JANGAN sengaja return non-2xx kalau notifikasi sudah berhasil diproses (nanti Doku kirim ulang notifikasi yang sama, harus di-handle idempotent, lihat poin berikutnya).

### WAJIB Idempotent
Karena Doku bisa retry (dan dalam kasus jaringan lambat, notifikasi yang sama bisa datang dobel), proses update `Order` HARUS idempotent:
- Cek dulu status `Order` saat ini — kalau SUDAH `paid`, langsung return `200` tanpa proses ulang (jangan generate tiket dobel!)
- Ini prinsip yang SAMA dengan Idempotency Key yang sudah didesain di `SPAM_CLICK_AND_MEMORY_BUDGET.md`, cuma sumbernya beda (di sana dari sisi request buyer, di sini dari sisi notifikasi Doku)

---

## 7. Mapping Status Doku → Status Order TAQtix

| `transaction.status` dari Doku | Aksi di TAQtix |
|---|---|
| `SUCCESS` | Update `Order.status = "paid"`, `Payment.status = "success"`, `Payment.paidAt = transaction.date`, generate `Ticket` + QR, trigger notifikasi WA/email |
| `FAILED` | Update `Payment.status = "failed"`. **JANGAN langsung set `Order.status = "cancelled"`** — sesuai catatan resmi Doku: Checkout page didesain supaya buyer bisa GANTI metode bayar kalau 1 metode gagal. Biarkan `Order` tetap `pending` sampai `expiredAt` (dari `payment.expired_date`) benar-benar lewat |
| `PENDING` | Tidak ada aksi khusus, tetap `pending`, tunggu notifikasi berikutnya |
| `EXPIRED` | Update `Order.status = "expired"`, kembalikan quota tiket/facility yang sempat dikunci (reuse logic auto-expire dari `TASK.md` Fase 1) |

**Insight penting dari dokumentasi resmi Doku** (dikutip di section 4 Integration Guide mereka): *"merchant must ignore the transaction.status FAILED... merchant are required to set the expiry time on merchant side based on payment.expired_date, so that if there is no SUCCESS transaction in between the time period, then merchant must flag the transaction status as cancelled."* — artinya **BE JANGAN terlalu agresif membatalkan order hanya karena 1 notifikasi FAILED masuk**, biarkan scheduled job auto-expire (berdasarkan `expiredAt`) yang jadi penentu akhir status gagal/cancelled.

---

## 8. Cek Status Manual (Fallback kalau Notifikasi Tidak Sampai)

Selain mengandalkan webhook, sediakan juga endpoint Check Status API dari Doku sebagai fallback (dipanggil scheduled job, misal tiap beberapa menit untuk `Order` yang masih `pending` mendekati `expiredAt`, jaga-jaga kalau webhook gagal terkirim karena alasan jaringan yang di luar kendali kedua sistem).

```
GET https://api-sandbox.doku.com/orders/v1/status/{invoice_number}
```
Signature untuk GET: sama seperti section 3, TANPA baris `Digest` (karena tidak ada body).

---

## Ringkasan Perbedaan dari Asumsi Awal (Midtrans/Xendit)

- Field environment variable BE berubah dari `PAYMENT_PROVIDER_KEY`/`PAYMENT_PROVIDER_SECRET` generic jadi `DOKU_CLIENT_ID`/`DOKU_SECRET_KEY` spesifik
- Model `Payment.provider` di `API_CONTRACT.md` sudah diupdate jadi `"doku"` saja (dilakukan di sesi sebelumnya)
- Signature Doku PAKAI `Digest` (hash dari body) yang digabung ke string-to-sign — ini beda dari kebanyakan payment gateway lain yang biasanya cukup HMAC dari body langsung, jadi kalau ada kode contoh dari provider lain yang di-adaptasi, JANGAN lupa tambahkan langkah Digest ini
