# TAQtix Mobile (Flutter) — TASK_ADDENDUM.md

> Tambahan dari `TASK.md`. Kerjakan Fase 0–2 di `TASK.md` dulu. Baca `../shared/PRODUCT_STRUCTURE_ADDENDUM.md` dan `../shared/API_CONTRACT_ADDENDUM.md` sebelum mulai.

---

## Keputusan Scope (Baca Dulu Sebelum Ngoding)

- **Crew self check-in TIDAK masuk app ini.** Sudah diarahkan to web (`fe-web/TASK_ADDENDUM.md` Fase H, route `crew/[token]`). Alasan: instalasi app untuk pemakaian beberapa menit adalah friksi berlebihan untuk volunteer/freelancer yang sifatnya temporary.
- **PIC Dashboard** dipertimbangkan masuk app ini KARENA PIC kemungkinan di lapangan, bukan di depan laptop. Tapi ini keputusan yang perlu kamu konfirmasi dulu (lihat Fase A di bawah) sebelum dikerjakan — jangan langsung develop tanpa kepastian kebutuhan riil.

---

## FASE A — PIC Workforce Dashboard (KONFIRMASI DULU SEBELUM KERJA)

**Pertanyaan yang harus dijawab dulu:**
1. Apakah PIC di event nyata kamu (Taqwa Movement, dst) adalah orang yang SAMA dengan gate staff yang pegang scanner? → Kalau ya, gabung jadi 1 app dengan tab switch, jangan bikin screen terpisah yang berat.
2. Apakah PIC butuh update real-time SAAT di venue, atau cukup cek sesekali dari HP mereka (bisa pakai browser, tidak perlu app native)? → Kalau cukup sesekali, SKIP fase ini, arahkan ke web version (lebih murah dibangun, tidak perlu app store review, dst).

**Kalau jawabannya "PIC beda orang dan butuh real-time monitoring dari HP":**

### A.1 — Login & Role
- [ ] `pic_login_screen.dart` — reuse flow login yang mirip `gate_login_screen.dart`, tapi role token beda (`OrganizerMember` dengan `picUserId` terkait)
- [ ] Simpan token di secure storage terpisah dari token gate_staff (kalau 1 device dipakai gantian oleh orang berbeda, jangan sampai tercampur)

### A.2 — Dashboard Screen
- [ ] `pic_dashboard_screen.dart`:
  - [ ] 4 kartu besar: Expected, Present, Late, Absent — font besar, gampang dibaca sekilas (PIC kemungkinan lihat sambil jalan/kerja, bukan duduk fokus)
  - [ ] List nama yang belum check-in, dengan tombol tap-to-call/WA langsung dari list item
  - [ ] Pull-to-refresh manual + auto-refresh polling tiap 30 detik (`GET /organizer/events/:id/workforce/pic-dashboard`)
  - [ ] Badge warna: merah untuk absent, kuning untuk late, hijau untuk present
- [ ] Handle offline: kalau tidak ada koneksi, tampilkan data terakhir yang di-cache dengan label jelas "Data terakhir diperbarui: [waktu]" — JANGAN tampilkan blank/error total

**Definition of done:** PIC bisa buka app di tengah venue, lihat status timnya dalam < 2 detik, dan langsung tau siapa yang perlu dihubungi.

---

## FASE B — Reuse Scanner untuk Workforce (Gate 2)

**Ini prioritas lebih tinggi dari Fase A** — lebih murah dikerjakan, langsung dipakai gate staff yang app-nya sudah ada.

### B.1 — Mode Switch
- [ ] Tambah widget toggle/segmented control di atas `scanner_screen.dart`: "Scan Tiket" vs "Scan Crew"
- [ ] State mode disimpan di Riverpod provider, persist selama sesi app terbuka (tidak perlu persist ke disk, reset tiap buka app baru — supaya gate staff tidak lupa ganti mode kalau pindah tugas)

### B.2 — Decode & Submit Berbeda per Mode
- [ ] Saat decode QR, baca field `type` dari payload JWT — kalau `"workforce"` tapi mode aktif `"Scan Tiket"` (atau sebaliknya), tampilkan warning "QR ini untuk mode [X], kamu sedang di mode [Y]" — cegah salah submit ke endpoint yang salah
- [ ] Mode "Scan Crew" → submit ke `/gate/workforce-scan` (bukan `/gate/scan`)
- [ ] `scan_result_widget.dart` — update untuk tampilkan info tambahan khusus crew: nama, divisi, role (bukan cuma valid/invalid seperti tiket audience)

### B.3 — Manifest & Cache
- [ ] Update `event_list_screen.dart` — saat download manifest, sekarang response `GET /gate/events/:eventId/manifest` include `workforceMembers` juga (lihat update di BE addendum Fase E)
- [ ] Tambah Isar collection `WorkforceCache` (id, eventId, qrPayloadHash, division, role, status) — terpisah dari `TicketCache` supaya query filter tidak tercampur
- [ ] Update summary screen setelah download: "2.500 tiket + 85 crew berhasil di-cache" (biar staff yakin KEDUA data sudah siap sebelum offline)

### B.4 — Sync Batch
- [ ] `sync_service.dart` — pastikan `ScanLog` menyimpan juga field `scanType: "audience" | "workforce"`, supaya saat sync batch, request ke `POST /gate/scan/batch` dan hasil workforce bisa dipisah dengan benar (atau kalau BE sediakan endpoint batch terpisah untuk workforce, sesuaikan)

**Definition of done:** 1 device, 1 app, gate staff bisa switch mode dan scan kedua jenis QR tanpa perlu app terpisah atau logout-login ulang. Test offline: scan campuran audience+crew saat wifi mati, semua tersimpan lokal dengan tipe yang benar, sync sukses tanpa tertukar.

---

## Prioritas

1. **FASE B** (reuse scanner) — kerjakan duluan, ROI jelas, tidak butuh keputusan bisnis tambahan
2. **FASE A** (PIC dashboard) — HANYA setelah pertanyaan di atas terjawab jelas dari kebutuhan riil event kamu. Kalau ragu, skip dan pakai web version dulu (lebih murah untuk divalidasi kebutuhannya sebelum invest ke native app).
