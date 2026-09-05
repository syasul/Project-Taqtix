# TAQtix Backend (Core Ticketing Engine & Platform API)

Sistem backend inti TAQtix untuk engine ticketing, transaksi pembayaran anti-double booking, check-in gate QR, manajemen afiliasi / ambassador, serta platform oversight untuk Super Admin dan Organizer.

---

## 🛠️ Tech Stack
- **Runtime:** Node.js 20+ dengan TypeScript
- **Framework:** NestJS (Modular architecture)
- **Database:** PostgreSQL (Row-level lock & transaction support)
- **ORM:** Prisma
- **Queue/Cache:** Redis + BullMQ (asinkron: notifikasi WA, email confirmation, settlement, auto-expire order)
- **Auth:** JWT (Access Token & Refresh Token, Scoped Token untuk Gate Staff)
- **Security:** Helmet, CORS, Throttler Rate Limiter, Global Validation Pipe
- **API Documentation:** Swagger / OpenAPI auto-generated pada `/docs`

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Prasyarat
- Node.js 20+
- Docker & Docker Compose (untuk Postgres & Redis)

### 2. Jalankan PostgreSQL & Redis
Di root direktori project:
```bash
docker-compose up -d
```
Container yang akan berjalan:
- `taqtix-postgres` di port `5432`
- `taqtix-redis` di port `6379`

### 3. Setup Environment Variables
Salin file konfigurasi:
```bash
cp .env.example .env
```
Pastikan `DATABASE_URL` dan `REDIS_URL` terhubung ke container Docker lokal.

### 4. Install Dependencies, Generate Prisma & Jalankan Migrasi
```bash
npm install
npx prisma generate
npx prisma migrate dev
```

### 5. Seeding Data Awal
Jalankan script seed untuk mengisi akun admin, organizer, gate staff, serta event contoh:
```bash
npx prisma db seed
```

#### Akun Hasil Seeding:
| Peran (Role) | Email | Password | Status | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@taqtix.id` | `password123` | Active | Akses penuh seluruh platform `/admin/*` |
| **Organizer (Aktif)** | `organizer@taqtix.id` | `password123` | Active | Mengelola event dan melihat dashboard |
| **Organizer (Pending)**| `organizer-pending@taqtix.id` | `password123` | Pending | Akun untuk menguji alur approval admin |
| **Gate Staff** | `staff@taqtix.id` | `password123` | Active | Scoped scan & check-in gate |

### 6. Menjalankan Server
```bash
npm run start:dev
```
Server akan berjalan di: `http://localhost:3001/v1`  
Dokumentasi Swagger OpenAPI interaktif: `http://localhost:3001/docs`

---

## 📂 Struktur Modular Backend
```
src/
  modules/
    auth/                  # Register, login, refresh, gate-login
    events/                # CRUD Event, publish & katalog publik
    ticket-categories/     # Manajemen tier / kategori tiket
    orders/                # Checkout, anti-overselling lock, promo, idempotency
    payments/              # Payment link, callback/webhook, verification
    tickets/               # QR signing & verification, manifest tiket
    gate/                  # Validasi QR, check-in scanner, sync batch offline
    partners/              # Distribusi tiket, ambassador & affiliate engine
    notifications/         # Worker BullMQ: WhatsApp gateway & Email
    dashboard/             # Agregasi metrik penjualan organizer
    admin/                 # Main platform oversight (approval, suspend, plan, audit)
    settlements/           # Perhitungan bagi hasil & payout settlement
  common/
    decorators/            # @CurrentUser, @Roles, @Public
    filters/               # HttpExceptionFilter (format error sesuai kontrak)
    guards/                # JwtAuthGuard, RolesGuard
    interceptors/          # ResponseInterceptor ({ success: true, data: ... })
  prisma/
    schema.prisma          # Skema database & relasi
    seed.ts                # Seeder data awal
main.ts                    # Entry point aplikasi
```

---

## 🛡️ Anti-Double Booking & Idempotency
- Pemesanan tiket (`POST /v1/orders`) menerapkan database transaction dengan row-level lock (`SELECT ... FOR UPDATE`) pada `TicketCategory` untuk memastikan kuota tidak pernah terjual melebihi kapasitas (overselling prevention).
- Mendukung header `Idempotency-Key` untuk mencegah request ganda dari browser atau koneksi jaringan lambat.
- Order yang belum dibayar dalam 10 menit otomatis kadaluwarsa (`expiredAt`) dan dikembalikan kuotanya melalui scheduler BullMQ.

---

## 🧪 Testing & Verifikasi
```bash
# Menjalankan unit test
npm run test

# Menjalankan type-check
npx tsc --noEmit
```
