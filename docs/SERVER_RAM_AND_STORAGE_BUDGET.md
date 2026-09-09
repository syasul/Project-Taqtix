# TAQtix — Panduan Konfigurasi Budget RAM (2.3GB / 4GB Server) & Storage Lokal

> Dokumen acuan operasional server produksi TAQtix. Menjamin seluruh service TAQtix beroperasi stabil di dalam pagu **2300 MB** pada server 4GB (bersama project eksternal 1024 MB dan buffer OS 700 MB).

---

## 1. Alokasi RAM per Service (Pagu Total: 2300 MB)

| Service | Alokasi RAM | Konfigurasi Memory Limit | Peran / Deskripsi |
|---|---|---|---|
| **PostgreSQL** | **400 MB** | `shared_buffers = 128MB` di `postgresql.conf` | Database utama (relational, row locking anti double-booking) |
| **Redis** | **150 MB** | `maxmemory 150mb`, `maxmemory-policy allkeys-lru` | Cache idempotency, session lock, antrean BullMQ |
| **BE — API Server (`taqtix-be`)** | **350 MB** | `NODE_OPTIONS=--max-old-space-size=300`, `max_memory_restart: 350M` | HTTP REST API core engine & checkout |
| **BE — Worker (`taqtix-be-worker`)** | **200 MB** | `NODE_OPTIONS=--max-old-space-size=170`, `max_memory_restart: 200M` | BullMQ worker mandiri (orders, CRM, notifikasi) |
| **FE — Web (`taqtix-fe-web`)** | **400 MB** | `NODE_OPTIONS=--max-old-space-size=350`, `max_memory_restart: 400M` | Portal pembeli (traffic tertinggi) |
| **FE — Admin / EO (`taqtix-admin`)** | **250 MB** | `NODE_OPTIONS=--max-old-space-size=220`, `max_memory_restart: 250M` | Dashboard manajemen event organizer |
| **FE — Affiliate (`taqtix-affiliates`)** | **200 MB** | `NODE_OPTIONS=--max-old-space-size=170`, `max_memory_restart: 200M` | Portal mitra afiliasi / partner |
| **Nginx (Reverse Proxy)** | **50 MB** | Default lightweight worker processes | Reverse proxy, SSL termination, static cache |
| **PM2 Daemon** | **50 MB** | Default PM2 memory footprint | Monitoring & proses watchdog |
| **Buffer Internal Cadangan** | **250 MB** | Cadangan dinamis dalam budget | Meredam spike temporer service internal |
| **TOTAL TAQtix** | **2300 MB** | | |

> **Keseimbangan Server Keseluruhan:**
> - Proyek Non-TAQtix: **1024 MB**
> - Proyek TAQtix: **2300 MB**
> - Spare Murni (Kernel Linux, Page Cache, OS): **~770 MB**
> - **Total Fisik Server: 4096 MB**

---

## 2. Rationale Pemisahan API Server dan Worker

1. **Isolasi Beban Berat**: Operasi intensif seperti ekspor data laporan CSV ribuan baris atau pengiriman broadcast pesan CRM massal diproses di `taqtix-be-worker`.
2. **Kestabilan Checkout**: Lonjakan memori pada worker **tidak akan pernah** memperlambat proses checkout tiket, validasi payment gateway, atau scanning tiket di gerbang pada `taqtix-be`.
3. **Pemberhentian Aman**: Jika worker mencapai `max_memory_restart` (200M), PM2 merestart worker secara mandiri tanpa downtime pada API publik.

---

## 3. Langkah Konfigurasi Server Produksi

### 3.1 PostgreSQL (`postgresql.conf`)
Edit file konfigurasi PostgreSQL (biasanya di `/etc/postgresql/<version>/main/postgresql.conf`):
```ini
shared_buffers = 128MB
work_mem = 4MB
maintenance_work_mem = 64MB
effective_cache_size = 256MB
```
Restart service dan verifikasi:
```bash
sudo systemctl restart postgresql
sudo -u postgres psql -c "SHOW shared_buffers;"
# Output yang diharapkan: 128MB
```

### 3.2 Redis (`redis.conf`)
Edit file konfigurasi Redis (biasanya di `/etc/redis/redis.conf`):
```ini
maxmemory 150mb
maxmemory-policy allkeys-lru
```
Restart service dan verifikasi:
```bash
sudo systemctl restart redis-server
redis-cli CONFIG GET maxmemory
# Output: "157286400" (150MB dalam bytes)
redis-cli CONFIG GET maxmemory-policy
# Output: "allkeys-lru"
```

### 3.3 Menjalankan PM2 Ecosystem
Dari root direktori project:
```bash
# Build seluruh aplikasi terlebih dahulu
pnpm build

# Jalankan PM2 dengan konfigurasi budget
pm2 start ecosystem.config.js

# Simpan state PM2 agar auto-start saat server reboot
pm2 save
pm2 startup
```

### 3.4 Monitoring Real-time
Gunakan monitoring terminal PM2:
```bash
pm2 monit
```
Atau cek daftar pemakaian memori ringkas:
```bash
pm2 list
```

---

## 4. Manajemen Disk Space (Penyimpanan Lokal Server)

Karena berkas berkas statis (banner, logo, foto lineup, dan berkas ekspor CSV) disimpan **secara lokal di server (bukan S3)**:

1. **Pembersih File Ekspor Otomatis**:
   - Service `exports.service.ts` menjalankan cron job `@Cron(CronExpression.EVERY_HOUR)` untuk menghapus berkas ekspor sementara di `uploads/exports/` yang berumur lebih dari 24 jam.
2. **Alert Monitoring Disk Usage**:
   - Buat cron job sederhana di server Linux untuk memberi peringatan jika disk melebihi 80%:
   ```bash
   # Tambahkan ke crontab (crontab -e)
   0 * * * * df -h / | awk 'NR==2 {print $5}' | sed 's/%//' | awk '{if ($1 > 80) system("echo Disk usage above 80% on TAQtix server | mail -s \"ALERT: Disk Space\" dev@taqtix.id")}'
   ```
3. **Backup Folder Uploads Terpisah**:
   - Direktori `uploads/` (banner, logo, flyer) wajib dibackup secara berkala (misal rsync harian ke server backup sekunder), terpisah dari backup database PostgreSQL.
