# TAQtix — Worst-Case Scenarios & Kerentanan (Risk Register)

> Dokumen ini HARUS dibaca ulang tiap kali mulai fase baru, bukan dibaca sekali di awal lalu dilupakan. Vibe coding mempercepat pengerjaan tapi tidak otomatis menghasilkan kode yang aman — kecepatan dan keamanan adalah trade-off yang harus disadari sepanjang jalan, bukan ditambal di akhir.

---

## 1. Risiko Spesifik Cara Kerja "Vibe Coding"

Ini risiko yang muncul KARENA metode kerja kamu, bukan risiko umum semua software project.

| Worst Case | Kenapa Bisa Terjadi | Mitigasi |
|---|---|---|
| **3 project (BE/FE/Mobile) saling tidak sinkron** — FE kirim field yang BE tidak expect, atau sebaliknya | Tiap project dikerjakan di sesi AI terpisah, tidak ada 1 orang yang hold context semuanya di kepala | Selalu buka `API_CONTRACT.md` & addendum-nya di awal SETIAP sesi coding baru, sebelum minta AI generate apapun |
| **Kode "terlihat benar" tapi ada bug keamanan tersembunyi** — misal guard permission ke-skip, validasi hilang | AI cenderung generate kode yang lolos "terlihat jalan" saat dites manual sekali, tapi tidak dites untuk edge case/attack case | Setelah tiap fase besar (terutama yang menyentuh uang/auth/permission), lakukan review manual — baca ulang kode guard-nya, jangan cuma tes happy path |
| **Scope terus membengkak** (kita sudah punya TASK.md + 2 addendum + addendum 2, makin lama makin banyak) | Tiap kali nemu insight baru, gampang tergoda nambah fitur alih-alih selesaikan yang sudah direncanakan | Disiplin ke urutan prioritas yang sudah ditulis di tiap file. Kalau ada ide baru, catat dulu di file terpisah, JANGAN langsung interupsi fase yang sedang dikerjakan |
| **Tidak ada satu pun automated test** | Vibe coding condong ke "generate lalu jalankan manual", testing otomatis sering dilewat karena terasa memperlambat | MINIMAL: test otomatis untuk 3 area paling kritikal — anti double-booking (concurrent request), permission guard (role x resource matrix), dan payment webhook idempotency. Area lain boleh manual dulu |
| **Secret/API key ke-commit ke git** | Copy-paste config dari 1 sesi AI ke file `.env`, lupa `.env` masuk `.gitignore`, atau AI generate contoh dengan key asli tertempel | Cek `.gitignore` di 3 project SEBELUM commit pertama kali. Audit history git kalau ternyata sudah ke-push (`git log -p | grep -i "key\|secret"`) |
| **Ketergantungan ke 1 orang (kamu) tanpa dokumentasi lain** | Semua context ada di kepala kamu + riwayat chat AI, kalau kamu sakit/CTO baru masuk, tidak ada yang bisa lanjutkan | Task.md dan API contract yang sudah dibuat INI adalah dokumentasi itu — jaga supaya selalu update, bukan basi begitu ada perubahan besar |

---

## 2. Kerentanan Teknis — Keamanan

### 2.1 Backend
| Kerentanan | Dampak Worst Case | Yang Harus Dipastikan |
|---|---|---|
| **Total harga order dihitung/dipercaya dari FE** | Buyer manipulasi request, bayar Rp1.000 untuk tiket Rp500.000 | BE SELALU hitung ulang total dari data quota+harga di database sendiri, JANGAN PERNAH percaya `totalAmount` yang dikirim FE |
| **Payment webhook tidak idempotent** | Payment gateway retry webhook (umum terjadi) → tiket ter-generate 2x, komisi affiliate ke-hitung 2x | Webhook handler HARUS cek dulu apakah order ini sudah diproses sebelum eksekusi apapun (idempotency key / cek status existing) |
| **Race condition di quota tiket** (sudah dibahas di task.md, tapi ini titik paling kritikal di seluruh sistem) | Overselling saat flash sale — organizer harus urus komplain ratusan orang yang bayar tapi tidak dapat tiket | Row lock/optimistic locking WAJIB, dan WAJIB di-load-test dengan concurrent request sebelum event nyata pertama |
| **Multi-tenant data leakage** — organizer A bisa akses data organizer B | Bug umum di sistem multi-tenant: lupa filter `organizerId` di 1 query saja sudah bocor | Setiap query yang scoped ke organizer HARUS filter `organizerId`/`OrganizerMember` di level query, bukan cuma di guard route. Audit ulang SEMUA endpoint `/organizer/*` sebelum go-live, cek satu-satu apakah query-nya benar-benar terisolasi |
| **Endpoint publik tanpa rate limit** (`GET /events`, checkout, dll) | Scraping data event/harga oleh kompetitor, atau brute-force ke endpoint promo code, atau DDoS sederhana | Rate limiting minimal di semua endpoint publik, lebih ketat lagi di endpoint yang rawan brute-force (validate-promo, login) |
| **QR payload bisa ditebak/dipalsukan** | Kalau signing lemah (misal HMAC secret pendek/predictable), orang bisa generate QR palsu yang "valid" | Signing secret HARUS random panjang (min 32 byte), simpan di secret manager bukan hardcode, rotate kalau pernah bocor |
| **SQL Injection / NoSQL Injection** dari fitur Segment (query dinamis dari kriteria user-defined) | Fitur Segment di addendum secara eksplisit rawan ini karena filternya dinamis | Sudah dicatat di task: WAJIB pakai query builder (Prisma `where` object), JANGAN PERNAH raw SQL string concat dari input organizer |
| **File upload tanpa validasi** (banner event, logo organizer, foto lineup) | Upload file malicious (script menyamar sebagai gambar), atau file raksasa yang bikin storage penuh | Validasi MIME type sungguhan (bukan cuma dari ekstensi nama file), validasi ukuran max, scan kalau bisa |
| **Admin panel jadi single point of failure keamanan** | 1 akun admin bocor = akses penuh ke SEMUA data & uang platform | MFA wajib (sudah dicatat di admin task.md), tapi PASTIKAN benar-benar diimplementasi, jangan di-skip karena "nanti saja" |

### 2.2 Frontend (Web)
| Kerentanan | Dampak Worst Case | Yang Harus Dipastikan |
|---|---|---|
| **Role-based UI dianggap cukup sebagai keamanan** | Sembunyikan tombol di FE itu UX, BUKAN security — orang bisa langsung call API kalau BE tidak validasi ulang | Sudah dicatat di addendum, tapi tekankan lagi: BE guard adalah satu-satunya yang boleh dipercaya |
| **XSS dari user-generated content** (nama event, deskripsi, nama buyer yang ditampilkan di dashboard) | Kalau ada input yang di-render tanpa sanitasi, bisa jadi vektor XSS | React by default escape output, TAPI hati-hati kalau ada `dangerouslySetInnerHTML` di mana pun (misal untuk rich text broadcast email) |
| **Token disimpan di localStorage** | Rawan XSS steal token | Ikuti rencana awal: httpOnly cookie, bukan localStorage, untuk access/refresh token |

### 2.3 Mobile
| Kerentanan | Dampak Worst Case | Yang Harus Dipastikan |
|---|---|---|
| **Secret signing QR tersimpan di app (kalau salah desain)** | Kalau app di-decompile dan ternyata menyimpan secret HMAC, siapa saja bisa generate QR palsu | Sudah dicatat di mobile task.md — app HANYA decode & baca expiry, TIDAK verify signature secara final di lokal, status final selalu dari server saat sync |
| **Geolocation spoofing untuk crew self check-in** | Crew "check-in" padahal tidak di lokasi (pakai fake GPS app) | Ini risiko yang sulit dihilangkan 100% di web/app biasa — mitigasi: kombinasikan dengan radius toleransi kecil + spot-check manual oleh PIC, jangan andalkan ini sebagai satu-satunya bukti kehadiran untuk hal yang berkonsekuensi besar (misal payroll freelancer) |
| **Data tiket ter-cache di device hilang/dicuri** | Device gate staff hilang saat event → data tiket (termasuk data pribadi buyer: nama, HP) bisa diakses orang lain | Enkripsi local storage (Isar support encryption), auto-clear cache setelah event selesai + sync final |

---

## 3. Worst-Case Operasional Saat Event Berlangsung

Ini skenario yang HARUS disimulasikan sebelum event nyata pertama (Fase 5 di rundown — Taqwa Movement sebagai Alpha Event).

| Skenario | Dampak | Kesiapan yang Harus Dicek |
|---|---|---|
| **Internet venue mati total saat gate buka** | Ribuan orang antri, tidak bisa validasi tiket | Offline-first sudah didesain di mobile app — TES BENERAN dengan mematikan wifi/data sebelum hari-H, jangan asumsi "harusnya jalan" |
| **Payment gateway down saat jam ramai pembelian** | Buyer tidak bisa checkout sama sekali | Punya rencana komunikasi (banner "sedang gangguan, coba lagi X menit"), idealnya 1 payment gateway cadangan untuk kasus ekstrem (opsional, tergantung budget) |
| **WhatsApp provider nge-ban nomor karena volume broadcast dianggap spam** | Semua notifikasi tiket (termasuk e-ticket delivery) berhenti total — ini KRITIKAL karena e-ticket dikirim lewat WA | Pakai WhatsApp Business API resmi (bukan cara unofficial/scraping), patuhi rate limit provider, dan siapkan FALLBACK: e-ticket juga bisa diakses dari halaman web `/e-ticket/[id]` langsung, jangan hanya bergantung ke WA sebagai satu-satunya cara buyer dapat tiket |
| **2 gate staff scan tiket sama persis saat sama-sama offline** | Race condition yang sudah diantisipasi di desain — tapi PASTIKAN benar-benar dites, bukan cuma diasumsikan aman | Simulasi skenario ini eksplisit sebelum event nyata (sudah dicatat sebagai definition of done di mobile task.md — jangan skip) |
| **Refund massal mendadak** (misal event terpaksa dibatalkan H-1) | Kalau tidak ada flow refund sama sekali di MVP, ini jadi krisis kepercayaan besar | Minimal siapkan proses MANUAL untuk refund (meski belum otomatis di sistem) — punya SOP dan kontak jelas sebelum hari-H, jangan improvisasi saat krisis beneran terjadi |
| **Settlement ke organizer telat/salah hitung** | Organizer tidak percaya lagi ke platform, bisa jadi berita buruk yang menyebar ke calon organizer litigation | Sebelum event nyata pertama selesai, HITUNG MANUAL settlement-nya juga sebagai cross-check ke angka yang sistem hasilkan — jangan percaya 100% ke sistem yang belum pernah diuji dengan uang sungguhan |

---

## 4. Risiko Data & Privasi (Penting untuk Konteks Indonesia)

| Risiko | Detail |
|---|---|
| **UU Perlindungan Data Pribadi (UU PDP)** | TAQtix menyimpan data pribadi cukup sensitif: nama, email, HP, kota, riwayat pembelian, bahkan lokasi (untuk geofence crew check-in). Ini masuk kategori data pribadi yang diatur UU PDP — organizer (sebagai pengendali data) dan TAQtix (sebagai pemroses) punya kewajiban: consent yang jelas saat pengumpulan data, purpose limitation (data hanya dipakai sesuai tujuan yang diinformasikan), dan hak buyer untuk minta data mereka dihapus. **Ini bukan area yang aman untuk "nanti dipikirkan belakangan"** — minimal siapkan privacy policy yang jelas dan consent checkbox di checkout sebelum kamu punya data ribuan buyer. |
| **Data breach exposure** | Kalau ada breach (BE ke-hack, admin akun bocor, dll), kamu punya kewajiban notifikasi ke pihak berwenang & pihak terdampak dalam jangka waktu tertentu di banyak yurisdiksi (dan makin diatur di Indonesia). Semakin banyak data yang kamu simpan tanpa alasan jelas (misal umur, yang disebut di dokumen CRM), semakin besar exposure kalau breach terjadi — pertimbangkan prinsip "kumpulkan seperlunya", bukan "kumpulkan semua yang mungkin berguna nanti". |
| **Third-party data sharing** | Meta Pixel, TikTok Pixel, GA yang dipasang di landing page event mengirim data user ke pihak ketiga — pastikan ini disebutkan di privacy policy, dan idealnya ada consent banner (cookie consent) kalau target market termasuk yang concern soal ini. |

---

## 5. Risiko Bisnis & Legal (Di Luar Teknis)

| Risiko | Detail |
|---|---|
| **Status hukum "memegang uang buyer sebelum diteruskan ke organizer"** | Model bisnis TAQtix mengumpulkan pembayaran dari buyer lalu settle ke organizer belakangan (bukan langsung ke rekening organizer). Tergantung skala dan cara kerjanya, ini bisa masuk area yang diawasi otoritas keuangan (di Indonesia terkait ranah OJK/BI soal penyelenggara jasa pembayaran). **Sangat disarankan konsultasi dengan yang paham regulasi fintech/payment di Indonesia** sebelum skala mulai besar (bukan cuma internal Taqwa Movement) — ini bukan sesuatu yang bisa "vibe coding"-kan, ini masalah legal murni. |
| **Ketergantungan penuh ke 1 payment gateway** | Kalau gateway itu suspend akun kamu (karena volume tinggi tiba-tiba dicurigai fraud, atau alasan compliance mereka sendiri), SEMUA transaksi berhenti total | Baca term of service gateway yang dipilih soal threshold volume yang butuh verifikasi tambahan, siapkan dari awal supaya tidak kaget saat transaksi mulai ramai |
| **Konsentrasi resiko di 1 event besar (Taqwa Movement) sebagai stress test pertama** | Kalau ada kegagalan besar di sini, dampaknya bukan cuma teknis tapi juga reputasi ke jaringan yang jadi target Phase 2 GTM (Jawa Timur) | Sudah bagus dijadikan alpha event, tapi pastikan ada contingency plan (siapa dihubungi kalau sistem down total saat event, proses manual fallback apa yang dipakai) |

---

## 6. Checklist Minimum SEBELUM Go-Live dengan Event Nyata Pertama

Ini bukan "nice to have" — kalau salah satu dari ini belum siap, tunda dulu tanggal go-live-nya.

- [ ] Load test checkout & payment webhook dengan concurrent request (target realistis: berapa buyer yang diperkirakan buka halaman bersamaan saat sale opens)
- [ ] Simulasi offline scanner (mati wifi, scan, nyalakan lagi, cek sync) — bukan cuma dites di kondisi ideal
- [ ] Audit manual SEMUA endpoint `/organizer/*` untuk multi-tenant isolation (tidak ada 1 pun query yang lupa filter organizerId)
- [ ] `.env` dan semua secret TIDAK ada di git history manapun
- [ ] MFA admin panel benar-benar aktif, bukan cuma direncanakan
- [ ] Ada fallback akses e-ticket selain WhatsApp (halaman web langsung)
- [ ] Ada SOP manual untuk refund darurat meski belum otomatis di sistem
- [ ] Privacy policy & consent checkout sudah ada (bukan placeholder kosong)
- [ ] Settlement pertama di-cross-check manual, tidak 100% percaya ke sistem yang belum pernah "battle-tested" dengan uang sungguhan
- [ ] Ada nomor kontak darurat (kamu/tim) yang siap standby saat event berlangsung, untuk kasus yang tidak bisa diselesaikan sistem sendiri

---

## Prinsip Umum untuk Sepanjang Development

1. **Uang dan permission adalah 2 area yang TIDAK BOLEH cuma "kelihatan jalan"** — selalu dites dengan skenario jahat (concurrent request, role yang salah coba akses, dll), bukan cuma happy path.
2. **BE adalah satu-satunya sumber kebenaran** — apapun yang dikirim FE/Mobile (harga, total, permission) harus dihitung/divalidasi ulang di BE, tidak pernah dipercaya mentah-mentah.
3. **Offline & failure scenario harus benar-benar disimulasikan**, bukan diasumsikan aman karena "sudah didesain untuk itu".
4. **Kecepatan vibe coding tidak menggantikan review** — makin cepat kode dihasilkan, makin penting waktu yang disisihkan untuk baca ulang bagian yang sensitif (auth, payment, permission) sebelum dianggap selesai.
