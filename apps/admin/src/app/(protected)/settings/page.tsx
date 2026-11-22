'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  Sparkles,
  Server,
  Armchair,
  Share2,
  ArrowLeftRight,
  Megaphone,
  Store,
  ClipboardList,
  Gift,
  Check,
  Zap,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformFeaturesResponse {
  allowGuestCheckoutFeature?: boolean;
  allowSeatingLayoutFeature?: boolean;
  allowAffiliatesProgramFeature?: boolean;
  allowTicketTransferFeature?: boolean;
  allowEoFeedFeature?: boolean;
  allowPosCashFeature?: boolean;
  allowCustomFieldsFeature?: boolean;
  allowDoorprizeFeature?: boolean;
  [key: string]: any;
}

interface FeatureConfig {
  key: string; // Database key (e.g. ALLOW_GUEST_CHECKOUT)
  apiKey: string; // Response object key (e.g. allowGuestCheckoutFeature)
  name: string;
  category: 'checkout' | 'event' | 'marketing' | 'operations';
  categoryLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  activeLabel: string;
  inactiveLabel: string;
  activeDesc: string;
  inactiveDesc: string;
  onBenefits: string[];
  offBenefits: string[];
}

const FEATURE_LIST: FeatureConfig[] = [
  {
    key: 'ALLOW_GUEST_CHECKOUT',
    apiKey: 'allowGuestCheckoutFeature',
    name: 'Fitur Pembelian Tiket Tanpa Login (Guest Checkout) untuk EO',
    category: 'checkout',
    categoryLabel: 'Transaksi & Checkout',
    icon: UserCheck,
    description:
      'Atur apakah Event Organizer (EO) diperbolehkan mengatur fitur pembelian tiket tanpa login (guest checkout) pada masing-masing event mereka.',
    activeLabel: 'AKTIF (EO Bebas Mengatur)',
    inactiveLabel: 'NONAKTIF (Wajib Login Seluruh Event)',
    activeDesc:
      'Pada dashboard seluruh EO, switch opsi "Wajibkan Pengunjung Login (Require Login)" DITAMPILKAN. EO dapat mengaktifkan atau menonaktifkan kebutuhan login per event sesuai kebutuhan mereka.',
    inactiveDesc:
      'Menu on/off disembunyikan sepenuhnya dari form buat/edit event EO. Seluruh transaksi di platform diwajibkan memiliki akun pembeli terverifikasi.',
    onBenefits: [
      'Menu on/off muncul di dashboard EO saat buat atau edit event.',
      'EO yang mematikan wajib login memperbolehkan pembeli beli tiket tanpa registrasi akun.',
      'Memberikan fleksibilitas penuh kepada organizer event.',
    ],
    offBenefits: [
      'Menu on/off disembunyikan sepenuhnya dari form buat/edit event EO.',
      'Semua event di platform otomatis mewajibkan pembeli memiliki akun/login.',
      'Meningkatkan validitas data pembeli dan mencegah order anonim secara ketat.',
    ],
  },
  {
    key: 'ALLOW_SEATING_LAYOUT',
    apiKey: 'allowSeatingLayoutFeature',
    name: 'Fitur Denah & Pemilihan Nomor Kursi Interaktif (Seating Layout)',
    category: 'event',
    categoryLabel: 'Event & Denah Kursi',
    icon: Armchair,
    description:
      'Kontrol ketersediaan sistem denah kursi interaktif (Grid Layout Builder) dan pemilihan nomor kursi seperti bioskop/teater untuk Event Organizer.',
    activeLabel: 'AKTIF (Fitur Denah Tersedia)',
    inactiveLabel: 'NONAKTIF (Denah Kursi Dinonaktifkan)',
    activeDesc:
      'Menu Denah & Kursi aktif di dashboard EO. EO dapat mengaktifkan fitur kursi pada event dan membuat denah section A-Z. Pembeli dapat memilih kursi di web.',
    inactiveDesc:
      'Menu editor denah kursi disembunyikan dari EO dan tombol pemilihan nomor kursi dinonaktifkan di laman checkout web pembeli.',
    onBenefits: [
      'EO dapat membuat denah panggung (Stage) dan baris kursi interaktif.',
      'Pembeli tiket dapat memilih nomor kursi langsung saat memesan tiket.',
      'Mendukung event indoor, teater seni, seminar, dan konser bertingkat.',
    ],
    offBenefits: [
      'Opsi denah kursi disembunyikan dari form event EO.',
      'Semua tiket dijual dengan sistem kuota standar tanpa nomor kursi.',
      'Menyederhanakan proses checkout untuk event festival / standing umum.',
    ],
  },
  {
    key: 'ALLOW_AFFILIATES_PROGRAM',
    apiKey: 'allowAffiliatesProgramFeature',
    name: 'Fitur Program Afiliasi & Jaringan Promoter (Affiliate Hub)',
    category: 'marketing',
    categoryLabel: 'Pemasaran & Afiliasi',
    icon: Share2,
    description:
      'Kontrol global modul afiliasi tiket: kode unik pelacakan komisi, portal partner, dan tab "Afiliasi & Promoter Hub" di profil publik EO.',
    activeLabel: 'AKTIF (Sistem Afiliasi Berjalan)',
    inactiveLabel: 'NONAKTIF (Sistem Afiliasi Ditutup)',
    activeDesc:
      'EO dapat membuat program afiliasi komisi per tiket. Promoter dapat login dan menyebarkan link unik, serta tab Afiliasi muncul di profil EO.',
    inactiveDesc:
      'Seluruh portal mitra promosi dan tab afiliasi di laman profil publik dinonaktifkan sementara oleh Superadmin platform.',
    onBenefits: [
      'Mendorong pertumbuhan penjualan tiket melalui jaringan promoter eksternal.',
      'Pelacakan klik dan konversi penjualan tiket otomatis 24 jam.',
      'Tab Promoter Hub aktif di laman publik penyelenggara.',
    ],
    offBenefits: [
      'Pendaftaran dan login mitra afiliasi ditutup sementara.',
      'Tab Afiliasi disembunyikan dari laman publik organizer.',
      'Menghindari beban pembayaran komisi promosi pada masa audit platform.',
    ],
  },
  {
    key: 'ALLOW_TICKET_TRANSFER',
    apiKey: 'allowTicketTransferFeature',
    name: 'Fitur Transfer E-Tiket Antar Pengguna (Ticket Transfer)',
    category: 'operations',
    categoryLabel: 'Operasional & Keamanan',
    icon: ArrowLeftRight,
    description:
      'Kontrol izin pemindahtanganan (transfer) tiket digital antar email/akun pembeli untuk mencegah peredaran tiket palsu dan calo.',
    activeLabel: 'AKTIF (Transfer Tiket Diizinkan)',
    inactiveLabel: 'NONAKTIF (Anti-Calo Strict Mode)',
    activeDesc:
      'Pembeli yang berhalangan hadir dapat mengirimkan e-ticket ke email teman/keluarga secara resmi melalui sistem verifikasi OTP TAQtix.',
    inactiveDesc:
      'Mode Anti-Calo Ketat aktif. Seluruh fitur pemindahtanganan tiket dinonaktifkan di seluruh platform. Tiket hanya berlaku untuk pemesan pertama.',
    onBenefits: [
      'Pengunjung dapat memindahtangankan tiket ke rekan jika berhalangan hadir.',
      'Riwayat transfer tercatat transparan dan QR code lama otomatis di-revoke.',
      'Memberikan kemudahan bagi grup pembeli tiket.',
    ],
    offBenefits: [
      'Mencegah spekulasi harga calo tiket di pasar gelap (secondary market).',
      'Mencegah penipuan jual-beli tiket pihak ketiga.',
      'Ideal diaktifkan saat penjualan tiket konser dengan antusiasme sangat tinggi.',
    ],
  },
  {
    key: 'ALLOW_EO_FEED',
    apiKey: 'allowEoFeedFeature',
    name: 'Fitur Kabar & Feed Komunitas EO (Community Feed)',
    category: 'marketing',
    categoryLabel: 'Pemasaran & Afiliasi',
    icon: Megaphone,
    description:
      'Kontrol apakah Event Organizer diizinkan mempublikasikan pengumuman kabar, rundown, dan update teaser di profil publik EO mereka.',
    activeLabel: 'AKTIF (Feed & Kabar Terbuka)',
    inactiveLabel: 'NONAKTIF (Feed Dinonaktifkan)',
    activeDesc:
      'EO dapat membuat postingan teks & gambar di dashboard "Kabar & Post". Audiens dapat membaca timeline berita terbaru di profil EO.',
    inactiveDesc:
      'Menu "Kabar & Post" di dashboard EO dan tab "Kabar & Feed" pada profil publik disembunyikan.',
    onBenefits: [
      'EO dapat berkomunikasi langsung dengan audiens dan para followers.',
      'Pengumuman rilis tiket, rundown, dan info parkir mudah diakses penonton.',
      'Meningkatkan engagement sosial akun penyelenggara.',
    ],
    offBenefits: [
      'Menyederhanakan laman profil EO hanya berfokus pada daftar event.',
      'Mencegah penyalahgunaan postingan yang tidak sesuai ketentuan.',
      'Mengurangi beban server media gambar kabar.',
    ],
  },
  {
    key: 'ALLOW_POS_CASH',
    apiKey: 'allowPosCashFeature',
    name: 'Fitur Kasir POS & Transaksi Tunai On-the-Spot (Cash & POS)',
    category: 'operations',
    categoryLabel: 'Operasional & Keamanan',
    icon: Store,
    description:
      'Kontrol apakah EO dan kru pintu masuk (gate) diperbolehkan menjual tiket fisik di lokasi dengan pembayaran tunai/kasir POS.',
    activeLabel: 'AKTIF (Loket POS & Tunai Diizinkan)',
    inactiveLabel: 'NONAKTIF (Strict Cashless Platform)',
    activeDesc:
      'EO dan petugas gate dapat membuka loket kasir offline, mencatat pembayaran kas fisik, dan mencetak tiket on-the-spot di venue.',
    inactiveDesc:
      'Platform berjalan dalam mode 100% Cashless. Penjualan tiket on-the-spot tunai ditiadakan, seluruh transaksi wajib melalui gateway resmi.',
    onBenefits: [
      'Memfasilitasi penonton go-show yang membeli tiket di hari H langsung di venue.',
      'Pencatatan kas dan rekonsiliasi uang fisik terintegrasi di sistem.',
      'Cetak tiket cepat dengan barcode gate scanner.',
    ],
    offBenefits: [
      'Mencegah risiko selisih kas fisik atau kecurangan di pintu masuk.',
      'Memastikan seluruh dana masuk langsung ke rekening penampungan resmi.',
      'Mendukung standar operasional event modern berbasis digital.',
    ],
  },
  {
    key: 'ALLOW_CUSTOM_FIELDS',
    apiKey: 'allowCustomFieldsFeature',
    name: 'Fitur Formulir Kustom & Syarat Pembeli Tambahan (Custom Fields)',
    category: 'checkout',
    categoryLabel: 'Transaksi & Checkout',
    icon: ClipboardList,
    description:
      'Kontrol apakah EO diperbolehkan membuat kuesioner atau pertanyaan formulir khusus (NIK/KTP, ukuran kaos, instansi) saat checkout tiket.',
    activeLabel: 'AKTIF (Formulir Kustom Tersedia)',
    inactiveLabel: 'NONAKTIF (Formulir Standar Kilat)',
    activeDesc:
      'EO bebas mendefinisikan field formulir tambahan per event. Pembeli diwajibkan mengisi data tersebut sebelum menyelesaikan pembayaran.',
    inactiveDesc:
      'Formulir pendaftaran dibatasi hanya pada data dasar (Nama, Email, WhatsApp). Pengaturan kustom di dashboard EO dinonaktifkan.',
    onBenefits: [
      'EO event maraton, seminar sertifikat, dan gathering dapat mengumpulkan data penting.',
      'Mendukung validasi identitas resmi pembeli (misal: NIK untuk event terbatas).',
      'Field dinamis (teks, dropdown, radio button).',
    ],
    offBenefits: [
      'Proses pembelian tiket menjadi super cepat (1-click checkout experience).',
      'Mengurangi bounce rate akibat formulir yang terlalu panjang.',
      'Mempercepat konversi penjualan tiket.',
    ],
  },
  {
    key: 'ALLOW_DOORPRIZE',
    apiKey: 'allowDoorprizeFeature',
    name: 'Fitur Undian Doorprize Acara (Event Lucky Draw)',
    category: 'event',
    categoryLabel: 'Event & Denah Kursi',
    icon: Gift,
    description:
      'Kontrol ketersediaan modul undian doorprize acak berbasis tiket yang telah berstatus check-in untuk penyelenggara acara.',
    activeLabel: 'AKTIF (Modul Doorprize Tersedia)',
    inactiveLabel: 'NONAKTIF (Doorprize Dinonaktifkan)',
    activeDesc:
      'Menu doorprize aktif di dashboard EO. EO dapat memasukkan daftar hadiah dan mengundi nomor tiket penonton yang sudah hadir secara live.',
    inactiveDesc:
      'Modul doorprize disembunyikan dari dashboard EO untuk event-event yang tidak memerlukan gamifikasi undian.',
    onBenefits: [
      'Meningkatkan kemeriahan acara dengan undian hadiah interaktif di layar panggung.',
      'Hanya penonton yang sudah check-in di gate yang masuk dalam undian.',
      'Transparan dan bebas manipulasi.',
    ],
    offBenefits: [
      'Menyederhanakan menu dashboard EO.',
      'Mengurangi fitur yang tidak relevan untuk promotor non-corporate.',
      'Fokus pada operasional tiket dan gate scanning.',
    ],
  },
];

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeInfoFeature, setActiveInfoFeature] = useState<FeatureConfig | null>(null);

  const { data: settingsData, isLoading } = useQuery<PlatformFeaturesResponse>({
    queryKey: ['admin-platform-settings'],
    queryFn: () => api.get<PlatformFeaturesResponse>('/admin/settings'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      api.patch('/admin/settings/toggle', { key, enabled }),
    onMutate: async ({ key, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-platform-settings'] });
      const prev = queryClient.getQueryData<PlatformFeaturesResponse>([
        'admin-platform-settings',
      ]);
      const targetFeature = FEATURE_LIST.find((f) => f.key === key);
      if (prev && targetFeature) {
        queryClient.setQueryData(['admin-platform-settings'], {
          ...prev,
          [targetFeature.apiKey]: enabled,
          [key]: enabled,
        });
      }
      return { prev };
    },
    onError: (err: any, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['admin-platform-settings'], context.prev);
      }
      toast.error(err?.message || 'Gagal memperbarui status fitur.');
    },
    onSuccess: (_res, { key, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-settings'] });
      const targetFeature = FEATURE_LIST.find((f) => f.key === key);
      const name = targetFeature?.name || key;
      toast.success(
        enabled
          ? `${name} berhasil DIAKTIFKAN.`
          : `${name} berhasil DINONAKTIFKAN (Strict Mode).`
      );
    },
  });

  const handleToggle = (feature: FeatureConfig, currentValue: boolean) => {
    if (toggleMutation.isPending) return;
    toggleMutation.mutate({ key: feature.key, enabled: !currentValue });
  };

  const getFeatureValue = (feature: FeatureConfig): boolean => {
    if (!settingsData) return true;
    if (settingsData[feature.apiKey] !== undefined) {
      return Boolean(settingsData[feature.apiKey]);
    }
    if (settingsData[feature.key] !== undefined) {
      return Boolean(settingsData[feature.key]);
    }
    return true;
  };

  const filteredFeatures = FEATURE_LIST.filter((f) => {
    if (selectedCategory === 'all') return true;
    return f.category === selectedCategory;
  });

  const totalFeatures = FEATURE_LIST.length;
  const activeFeaturesCount = FEATURE_LIST.filter((f) => getFeatureValue(f)).length;
  const inactiveFeaturesCount = totalFeatures - activeFeaturesCount;

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-[#08B4B5] border border-teal-200">
            Main Admin Console (core.taqtix.id)
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-[#08B4B5]" />
          Pengaturan Sistem & Fitur Platform
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
          Kelola feature flags global, kontrol hak akses fitur Event Organizer, dan kebijakan pembatasan platform TAQtix secara real-time.
        </p>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Fitur</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalFeatures}</p>
          <span className="text-[10px] text-slate-500 font-medium">Feature Flags Global</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Fitur Aktif</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeFeaturesCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Bebas Diakses EO & User</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Dibatasi / Nonaktif</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{inactiveFeaturesCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Strict Policy Mode</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#08B4B5]">Sinkronisasi</span>
          <p className="text-base font-extrabold text-slate-900 mt-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#08B4B5]" />
            Real-Time
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Langsung Berdampak ke EO</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'Semua Fitur' },
          { id: 'checkout', label: 'Transaksi & Checkout' },
          { id: 'event', label: 'Event & Denah Kursi' },
          { id: 'marketing', label: 'Pemasaran & Afiliasi' },
          { id: 'operations', label: 'Operasional & Keamanan' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === tab.id
                ? 'bg-[#08B4B5] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List of Feature Setting Cards */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
            <span className="text-xs font-semibold text-slate-400">Memuat pengaturan fitur platform...</span>
          </div>
        ) : (
          filteredFeatures.map((feature) => {
            const isEnabled = getFeatureValue(feature);
            const Icon = feature.icon;

            return (
              <div
                key={feature.key}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Icon, Category, Title, Info Button, Description */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <span className="p-2.5 rounded-xl bg-teal-50 text-[#08B4B5] border border-teal-100 shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {feature.categoryLabel}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            isEnabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {isEnabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {feature.name}
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveInfoFeature(feature)}
                          className="inline-flex items-center justify-center p-1 rounded-full text-slate-400 hover:text-[#08B4B5] hover:bg-teal-50 transition-colors"
                          title="Klik untuk melihat penjelasan informasi fitur"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Info Button + Toggle Switch */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => setActiveInfoFeature(feature)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-teal-50 hover:text-[#08B4B5] border border-slate-200 transition-colors shadow-2xs"
                      title="Lihat informasi & aturan fitur"
                    >
                      <Info className="w-3.5 h-3.5 text-[#08B4B5]" />
                      <span>Info</span>
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      onClick={() => handleToggle(feature, isEnabled)}
                      disabled={toggleMutation.isPending}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-[#08B4B5]' : 'bg-slate-300'
                      } ${toggleMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Feature Info Modal */}
      {activeInfoFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveInfoFeature(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-teal-50 text-[#08B4B5] border border-teal-100 shrink-0">
                  <activeInfoFeature.icon className="w-6 h-6" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {activeInfoFeature.categoryLabel}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {activeInfoFeature.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveInfoFeature(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Feature Status Box */}
            {(() => {
              const isEnabled = getFeatureValue(activeInfoFeature);
              return (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                    isEnabled
                      ? 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-200/90 text-amber-950'
                  }`}
                >
                  {isEnabled ? (
                    <Unlock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm">
                        Status Fitur: {isEnabled ? activeInfoFeature.activeLabel : activeInfoFeature.inactiveLabel}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isEnabled ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                        }`}
                      >
                        {isEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isEnabled ? activeInfoFeature.activeDesc : activeInfoFeature.inactiveDesc}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Side-by-side Comparison Info Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Di-ON-kan Box */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ketika Fitur Di-ON-kan (Default / Fleksibel):</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 pl-5 list-disc marker:text-emerald-500">
                  {activeInfoFeature.onBenefits.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>

              {/* Di-OFF-kan Box */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Ketika Fitur Di-OFF-kan (Strict Mode):</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 pl-5 list-disc marker:text-amber-500">
                  {activeInfoFeature.offBenefits.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveInfoFeature(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Audit Notice Box */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-start gap-3.5 shadow-xs">
        <Server className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-800">
            Informasi Sistem & Keamanan Platform
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Perubahan feature flags ini berlaku secara real-time di seluruh infrastruktur TAQtix (API Backend, Dashboard Organizer partner.taqtix.id, dan Web Frontend Pembeli taqtix.id). Setiap aksi toggle otomatis dicatat ke dalam audit log demi akuntabilitas platform.
          </p>
        </div>
      </div>
    </div>
  );
}
