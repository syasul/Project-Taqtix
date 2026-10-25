# TAQtix — Panduan Konfigurasi Alokasi RAM Maksimal (Dedicated 4GB Server) & Storage Lokal

> Dokumen acuan operasional server produksi TAQtix. Mengoptimalkan pemanfaatan memori secara penuh (mentok) pada server VPS **4 GB (4096 MB)** agar performa transaksi tiket, SSR, dan antrean background berjalan maksimal dengan stabilitas tinggi.

---

## 1. Alokasi RAM per Service (Pagu Dedicated 4GB)

| Service | Alokasi RAM | Konfigurasi Memory Limit | Peran / Deskripsi |
|---|---|---|---|
| **PostgreSQL** | **600 MB** | `shared_buffers = 256MB` di `postgresql.conf` | Database utama (relational, row locking anti double-booking) |
| **Redis** | **250 MB** | `maxmemory 256mb`, `maxmemory-policy allkeys-lru` | Cache idempotency, session lock, antrean BullMQ |
| **BE — API Server (`taqtix-be`)** | **800 MB** | `NODE_OPTIONS=--max-old-space-size=700`, `max_memory_restart: 800M` | HTTP REST API core engine & checkout (war tiket ready) |
| **BE — Worker (`taqtix-be-worker`)** | **400 MB** | `NODE_OPTIONS=--max-old-space-size=350`, `max_memory_restart: 400M` | BullMQ worker mandiri (orders, CRM, invoice, notifikasi) |
| **FE — Web (`taqtix-fe-web`)** | **800 MB** | `NODE_OPTIONS=--max-old-space-size=700`, `max_memory_restart: 800M` | Portal pembeli (traffic tertinggi, Next.js SSR) |
| **FE — Admin / EO (`taqtix-admin`)** | **400 MB** | `NODE_OPTIONS=--max-old-space-size=350`, `max_memory_restart: 400M` | Dashboard manajemen event organizer (`apps/eo`) |
| **FE — Affiliate (`taqtix-affiliates`)** | **300 MB** | `NODE_OPTIONS=--max-old-space-size=250`, `max_memory_restart: 300M` | Portal mitra afiliasi / partner (`apps/affiliates`) |
| **Nginx (Reverse Proxy)** | **50 MB** | Default lightweight worker processes | Reverse proxy, SSL termination, static cache |
| **PM2 Daemon** | **50 MB** | Default PM2 memory footprint | Monitoring & proses watchdog |
| **Buffer Internal Cadangan** | **100 MB** | Cadangan dinamis dalam budget | Meredam spike temporer service internal |
| **TOTAL STACK TAQtix** | **3750 MB** | | |

> **Keseimbangan Server Keseluruhan:**
> - Proyek TAQtix + Database Stack: **3750 MB**
> - Spare Murni (Kernel Linux, Page Cache, SSH, Systemd): **~346 MB**
> - **Total Fisik Server: 4096 MB (4 GB)**

---

## 2. Rationale Pemisahan API Server dan Worker

1. **Isolasi Beban Berat**: Operasi intensif seperti ekspor data laporan CSV ribuan baris atau pengiriman broadcast pesan CRM massal diproses di `taqtix-be-worker`.
2. **Kestabilan Checkout**: Lonjakan memori pada worker **tidak akan pernah** memperlambat proses checkout tiket, validasi payment gateway, atau scanning tiket di gerbang pada `taqtix-be`.
3. **Pemberhentian Aman**: Jika worker mencapai `max_memory_restart` (400M), PM2 merestart worker secara mandiri tanpa downtime pada API publik.

---

## 3. Langkah Konfigurasi Server Produksi

### 3.1 PostgreSQL (`postgresql.conf`)
Edit file konfigurasi PostgreSQL (biasanya di `/etc/postgresql/<version>/main/postgresql.conf`):
```ini
shared_buffers = 256MB
work_mem = 8MB
maintenance_work_mem = 64MB
effective_cache_size = 1GB
```
Restart service dan verifikasi:
```bash
sudo systemctl restart postgresql
sudo -u postgres psql -c "SHOW shared_buffers;"
# Output yang diharapkan: 256MB
```

### 3.2 Redis (`redis.conf`)
Edit file konfigurasi Redis (biasanya di `/etc/redis/redis.conf`):
```ini
maxmemory 256mb
maxmemory-policy allkeys-lru
```
Restart service dan verifikasi:
```bash
sudo systemctl restart redis-server
redis-cli CONFIG GET maxmemory
# Output: "268435456" (256MB dalam bytes)
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
