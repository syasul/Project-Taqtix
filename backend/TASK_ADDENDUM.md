# TAQtix Backend — TASK_ADDENDUM.md

> Tambahan dari `TASK.md`. Kerjakan Fase 0–4 di `TASK.md` dulu sampai jalan. Baca `../shared/PRODUCT_STRUCTURE_ADDENDUM.md` (konteks kenapa) dan `../shared/API_CONTRACT_ADDENDUM.md` (bentuk data & endpoint PERSIS) sebelum mulai — jangan improvisasi bentuk response sendiri.

---

## FASE A — Team Access (Multi-user per Organizer)

**Paling fundamental — banyak fase lain butuh sistem role ini.**

### A.1 — Schema & Migration
- [ ] Tambah model `OrganizerMember` di Prisma persis sesuai `API_CONTRACT_ADDENDUM.md` section 1
- [ ] Migration: saat migrate data existing (kalau sudah ada organizer lama dari `TASK.md` awal), buat 1 `OrganizerMember` otomatis dengan role `owner` untuk tiap organizer yang sudah ada — supaya tidak ada organizer yang "yatim" tanpa owner
- [ ] Tambah unique constraint `(organizerId, email)` — 1 email cuma bisa 1 kali per organizer

### A.2 — Invite Flow
- [ ] `POST /organizer/team/invite`:
  - [ ] Validasi: email format valid, role salah satu dari enum
  - [ ] Cek `EMAIL_ALREADY_MEMBER` kalau email sudah ada di organizer ini (status apapun kecuali `removed`)
  - [ ] Generate `inviteToken` (random 32 byte, hex), simpan dengan expiry 7 hari dari sekarang
  - [ ] Trigger job kirim email + WA (kalau nomor HP juga diisi) berisi link `https://app.taqtix.id/team/accept/{inviteToken}`
  - [ ] Guard: hanya role `owner` yang boleh invite (cek permission matrix)
- [ ] `POST /organizer/team/accept-invite/:token`:
  - [ ] Cek token exists & belum expired (`INVITE_EXPIRED` kalau lewat 7 hari)
  - [ ] Cek token belum dipakai (`INVITE_ALREADY_USED` kalau `joinedAt` sudah terisi)
  - [ ] Create `User` baru kalau email belum punya akun, atau link ke `User` existing kalau email sudah pernah daftar sebagai buyer (reuse akun, tambah role baru)
  - [ ] Set `OrganizerMember.status = "active"`, `joinedAt = now()`
  - [ ] Return `accessToken`/`refreshToken` langsung (auto-login setelah accept)

### A.3 — Kelola Anggota
- [ ] `GET /organizer/team` — list, guard: semua role bisa lihat (read-only untuk non-owner)
- [ ] `PATCH /organizer/team/:memberId/role`:
  - [ ] Guard: hanya `owner`
  - [ ] Validasi: tolak kalau hasil perubahan bikin organizer 0 owner aktif (`LAST_OWNER_CANNOT_DEMOTE`)
- [ ] `DELETE /organizer/team/:memberId`:
  - [ ] Guard: hanya `owner`, tidak bisa remove diri sendiri kalau dia satu-satunya owner
  - [ ] Soft delete: `status = "removed"`, JANGAN hapus row (untuk audit & histori aktivitas yang sudah dia buat)
  - [ ] Invalidate semua active session milik member yang di-remove (revoke refresh token)

### A.4 — Permission Guard (Krusial)
- [ ] Buat `PermissionGuard` decorator/middleware yang baca `OrganizerMember.role` dari token, cocokkan ke permission matrix di `API_CONTRACT_ADDENDUM.md` section 1
- [ ] Ganti SEMUA guard lama `OrganizerGuard` (yang cuma cek "apakah organizer") di endpoint Fase 1-4 (`TASK.md`) untuk pakai `PermissionGuard` ini dengan resource yang sesuai
- [ ] Test matrix: buat test case otomatis untuk minimal 5 kombinasi role x resource yang paling kritikal (misal: `finance` coba akses create-event → harus 403; `viewer` coba akses apapun selain GET → harus 403)

**Definition of done:** Semua endpoint `/organizer/*` yang sudah dibangun sebelumnya sekarang cek role granular, bukan cuma "apakah dia organizer ini". Invite → accept → login berjalan penuh dari email kosong sampai bisa akses dashboard.

---

## FASE B — Executive Dashboard (Overview)

- [ ] `GET /organizer/overview`:
  - [ ] Query aggregate SUM(revenue), COUNT(tickets sold) dari SEMUA event milik organizer (JOIN lewat organizerId, bukan per event)
  - [ ] Filter event yang statusnya `published` and `startDate <= now <= endDate` untuk field "event berjalan hari ini"
  - [ ] Query workforce status aggregate HANYA dari event yang sedang berjalan (join ke `WorkforceMember` kalau Fase E sudah selesai)
  - [ ] Grafik tren: group by bulan, ambil 6 bulan terakhir, return array `{ month, revenue }`
  - [ ] Cache response ini 5 menit (Redis) — endpoint ini kemungkinan sering dipanggil (halaman pertama yang dibuka), tidak perlu real-time strict

**Definition of done:** Response time endpoint ini < 500ms meski organizer punya puluhan event (berkat cache + index yang benar di `organizerId` + `status`).

---

## FASE C — Analytics: 4 Sub-Report

Referensi bentuk response persis di `API_CONTRACT_ADDENDUM.md` section 6.

- [ ] `GET /organizer/events/:id/analytics/sales`:
  - [ ] `byCategory`: GROUP BY ticketCategoryId, SUM(qty), SUM(unitPrice*qty) dari `OrderItem` yang order-nya status `paid`
  - [ ] `byDay`: GROUP BY DATE(order.createdAt)
- [ ] `GET /organizer/events/:id/analytics/distribution`:
  - [ ] Kategorikan order jadi channel: kalau ada `affiliateCode` → `"affiliate"`, kalau ada `utmSource` → pakai value itu, selain itu → `"organic"` atau `"direct_link"` (tentukan aturan persis sebelum implementasi, dokumentasikan di sini kalau berubah)
- [ ] `GET /organizer/events/:id/analytics/audience`:
  - [ ] `newBuyers` vs `returningBuyers`: cek apakah email/phone buyer pernah muncul di order `paid` SEBELUM event ini (across event manapun milik organizer yang sama)
  - [ ] `topCities`: butuh field `city` di buyer data — pastikan form checkout FE punya field ini (cek dengan tim FE, field ini sebelumnya tidak eksplisit ada di `OrderItem`)
- [ ] `GET /organizer/events/:id/analytics/performance`:
  - [ ] `landingPageViews`, `checkoutStarted`: butuh tracking event terpisah — tambah endpoint kecil `POST /track/page-view` and `POST /track/checkout-started` yang dipanggil FE (fire-and-forget, tidak perlu response penting)
  - [ ] `checkoutCompleted`: COUNT order status `paid`
  - [ ] `avgCheckoutTimeSeconds`: selisih `order.createdAt` dan `payment.paidAt`, di-average

**Definition of done:** 4 endpoint independen, masing-masing bisa dites terpisah, tidak saling bergantung satu query besar.

---

## FASE D — Growth Dashboard

- [ ] Tambah field `utmSource`, `utmMedium`, `utmCampaign` (nullable) ke model `Order` — update Prisma schema & migration
- [ ] `POST /orders` (endpoint lama dari `TASK.md`) — update supaya terima & simpan 3 field UTM ini kalau dikirim FE
- [ ] `POST /organizer/events/:id/ad-spend` — simpan manual spend entry
- [ ] `GET /organizer/events/:id/growth-dashboard`:
  - [ ] Hitung revenue per channel dari `Order.utmSource` yang match `AdSpend.channel`
  - [ ] `roas = revenue / spend`, handle divide-by-zero (return `null` kalau spend = 0, jangan crash)
  - [ ] `topAffiliates`: reuse query yang sama dengan endpoint partner leaderboard yang sudah ada di `TASK.md` Fase 3, tinggal limit top 5

**Definition of done:** Growth dashboard bisa jawab ROAS per channel dengan data yang organizer input manual — dites dengan skenario: input spend Rp10jt, ada 5 order dengan `utmSource=tiktok_ads` totalnya Rp42jt → ROAS harus muncul 4.2.

---

## FASE E — Workforce Lite

Referensi model & endpoint persis di `API_CONTRACT_ADDENDUM.md` section 2.

- [ ] Tambah model `WorkforceMember` di Prisma
- [ ] `POST /organizer/events/:id/workforce`:
  - [ ] Generate `qrPayload` pakai signing function YANG SAMA dengan tiket audience (reuse dari `TASK.md` Fase 1), tapi `type: "workforce"`
  - [ ] Guard: role `owner`/`admin` saja (sesuai permission matrix)
- [ ] `GET /organizer/events/:id/workforce?division=X&status=Y` — filter query params opsional
- [ ] `GET /organizer/events/:id/workforce/pic-dashboard`:
  - [ ] Kalau caller adalah `OrganizerMember` yang jadi `picUserId` di beberapa `WorkforceMember`, WAJIB auto-filter ke divisi itu (jangan andalkan FE untuk filter, karena kalau backend tidak filter, PIC bisa lihat data divisi lain lewat direct API call)
  - [ ] Definisi "late": buat field konfigurasi `event.lateThresholdMinutes` (default 15), kalau `now > shiftStartTime + lateThresholdMinutes` dan belum check-in → masuk hitungan "late", kalau shift sudah lewat total durasi + threshold dan tetap belum check-in → masuk "absent"
- [ ] `POST /gate/workforce-scan`:
  - [ ] Sama alur dengan `/gate/scan` (Fase 2 di `TASK.md`): verify signature, cek status, update jadi `present`, catat `checkedInMethod: "gate_scan"`
  - [ ] Response sertakan `division` & `role` biar gate staff/mobile app bisa tampilkan konteks siapa yang baru check-in
- [ ] Update `GET /gate/events/:eventId/manifest` (endpoint lama) — sekarang HARUS include workforce data juga, bukan cuma tiket audience (tambah field `workforceMembers: WorkforceMember[]` di response), supaya mobile app addendum bisa cache offline keduanya sekaligus

**Definition of done:** Simulasi 30 anggota workforce, 3 divisi berbeda dengan PIC berbeda — tiap PIC login hanya lihat divisinya sendiri, tidak bisa akses divisi lain meski coba manipulasi query param manual.

---

## FASE F — Crew Self-Service

Referensi persis di `API_CONTRACT_ADDENDUM.md` section 3.

- [ ] Generate `CrewSession` JWT saat `WorkforceMember` dibuat (Fase E), kirim link berisi token ini via WA saat organizer broadcast info to crew (bisa manual dulu di MVP — organizer copy link dari halaman workforce, kirim sendiri)
- [ ] `GET /crew/me?token=` — decode & verify JWT, return info dasar (tanpa perlu login/password sama sekali)
- [ ] `POST /crew/self-check-in`:
  - [ ] Kalau `event.geofenceLat` ada isinya → hitung haversine distance dari lat/lng yang dikirim ke titik geofence, tolak (`OUTSIDE_VENUE_RADIUS`) kalau lebih dari `geofenceRadius` meter
  - [ ] Kalau `event.geofenceLat` null → skip validasi lokasi, langsung terima check-in (organizer yang pilih mau strict atau tidak per event)
  - [ ] Update `WorkforceMember.status = "present"`, `checkedInMethod: "self_service"`
- [ ] Tambah 3 field baru ke model `Event` (nullable): `geofenceLat`, `geofenceLng`, `geofenceRadius` — update endpoint `PATCH /organizer/events/:id` supaya bisa set ini juga

**Definition of done:** Test dari browser HP: buka link crew, geolocation permission, tap check-in — kalau di luar radius yang ditentukan, dapat pesan error jelas (bukan generic error).

---

## FASE G — Audience CRM: Segments & Communication

Referensi persis di `API_CONTRACT_ADDENDUM.md` section 5.

- [ ] Tambah model `Segment` — simpan `criteria` sebagai JSON column
- [ ] `POST /organizer/events/:id/segments` — simpan definisi kriteria (tidak compute member saat create, cukup simpan definisinya)
- [ ] `GET /organizer/segments/:id/members`:
  - [ ] Translate `criteria` JSON jadi query dinamis (kalau pakai Prisma, build `where` clause secara programatic berdasarkan field yang ada di criteria — jangan pakai raw SQL string concat untuk hindari injection)
  - [ ] Return list buyer yang match SEMUA kriteria yang diisi (AND logic antar field, OR logic dalam 1 field misal beberapa city)
- [ ] `POST /organizer/segments/:id/broadcast`:
  - [ ] Ambil snapshot member list SAAT itu juga (bukan lazy re-query pas job jalan)
  - [ ] Push to BullMQ queue dengan rate limiter: max 60 job/menit (`Bull` punya built-in rate limiter per queue, gunakan itu, jangan bikin sendiri)
  - [ ] Replace placeholder `{name}` di message per penerima sebelum kirim
  - [ ] Simpan record broadcast job (status per penerima: `sent`/`failed`) untuk endpoint status
- [ ] `GET /organizer/broadcasts/:jobId/status` — hitung progress dari record di atas

**Definition of done:** Buat segmen "pernah beli event sebelumnya", cek member count masuk akal, kirim broadcast test ke <10 orang dulu sebelum coba ke ratusan — pastikan rate limit benar-benar mencegah spam ke provider WA.

---

## FASE H — Settings Module

- [ ] `GET/PATCH /organizer/settings/organization` — guard: semua role bisa GET, hanya `owner` bisa PATCH
- [ ] `GET/PATCH /organizer/settings/payment` — guard: `owner`/`finance` saja (sesuai permission matrix)
- [ ] `GET/PATCH /organizer/settings/integrations` — simpan pixel ID sebagai JSON `{ metaPixelId, tiktokPixelId, gaTrackingId }`, expose value ini di endpoint publik event detail (`GET /events/:slug`) supaya FE bisa pasang pixel di landing page tanpa hardcode

**Definition of done:** Ubah data organisasi tersimpan, dan pixel ID yang diisi organizer benar-benar muncul di response public event endpoint (siap dipasang FE).

---

## FASE I — Partner Self-Service Portal (Backend)

Referensi persis di `API_CONTRACT_ADDENDUM.md` section 4.

- [ ] Tambah field `email`, `passwordHash` (nullable) ke model `Partner`
- [ ] `POST /partner/auth/request-magic-link`:
  - [ ] Generate token random, simpan dengan expiry singkat (15 menit)
  - [ ] Kirim link via email (kalau ada) atau WA (kalau nomor HP tersedia di data partner)
  - [ ] Jangan bocorkan apakah email terdaftar atau tidak di response (response sama persis baik email ada maupun tidak — cegah email enumeration)
- [ ] `POST /partner/auth/verify-magic-link` — verify token, issue `accessToken` role `partner`, token ini SCOPED hanya ke `/partner/*`
- [ ] `GET /partner/me/stats` — reuse logic dari endpoint leaderboard organizer (Fase 3 `TASK.md`), tapi filter hanya data partner yang login (dari token, bukan dari parameter — supaya partner tidak bisa akses data partner lain dengan ganti ID)
- [ ] `GET /partner/me/payout-history` — dari tabel settlement/commission record yang terkait `partnerId` ini

**Definition of done:** Partner request magic link, klik, login otomatis, dan HANYA lihat datanya sendiri — test dengan 2 partner berbeda pastikan tidak bisa saling intip data.

---

## Urutan Pengerjaan yang Disarankan

```
FASE A (Team Access)
    ↓ (fondasi permission dipakai semua fase lain)
FASE E (Workforce Lite) ──┬── FASE F (Crew Self-Service)
                           │
FASE I (Partner Portal)    │
                           │
FASE C (Analytics) ── FASE D (Growth Dashboard)
                           │
FASE G (Segments) ── FASE H (Settings)
                           │
FASE B (Overview) — paling terakhir, paling gampang, tidak blocking apapun
```

## Backlog (Phase 3 — belum perlu)

- [ ] Billing/subscription charge otomatis
- [ ] Fitur cetak tiket fisik
- [ ] Enterprise custom registration builder
- [ ] Integrasi langsung Meta/TikTok Ads API (auto-pull spend, ganti input manual)
- [ ] Command Center gabungan real-time (audience + workforce + gate status dalam 1 dashboard)
