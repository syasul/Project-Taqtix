'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  MapPin,
  Ticket,
  Users,
  Share2,
  CheckCircle2,
  Globe,
  Instagram,
  Youtube,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Building2,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  FileText,
  UserPlus,
  UserCheck,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Custom TikTok Icon
const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 4.84 1.55v-3.5a4.84 4.84 0 0 1-1.07-.11Z" />
  </svg>
);

export default function OrganizerPublicPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followerEmail, setFollowerEmail] = useState('');
  const [followerName, setFollowerName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Load stored follower email from localStorage if available
  useEffect(() => {
    if (user?.email) {
      setFollowerEmail(user.email);
    } else {
      const stored = localStorage.getItem('taqtix_follower_email');
      if (stored) setFollowerEmail(stored);
    }
  }, [user]);

  // Fetch Organizer Public Data
  const {
    data: profileData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['organizer-public', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/organizers/public/${slug}`);
      return res.data?.data || res.data;
    },
    enabled: !!slug,
  });

  // Check Follow Status
  const { data: followStatus } = useQuery({
    queryKey: ['organizer-is-following', slug, followerEmail],
    queryFn: async () => {
      if (!followerEmail) return { isFollowing: false };
      const res = await apiClient.get(`/organizers/public/${slug}/is-following`, {
        params: { email: followerEmail },
      });
      return res.data;
    },
    enabled: !!slug && !!followerEmail,
  });

  // Toggle Follow Mutation
  const followMutation = useMutation({
    mutationFn: async (payload: { email: string; name?: string }) => {
      const res = await apiClient.post(`/organizers/public/${slug}/follow`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizer-public', slug] });
      queryClient.invalidateQueries({ queryKey: ['organizer-is-following', slug, followerEmail] });
      if (followerEmail) {
        localStorage.setItem('taqtix_follower_email', followerEmail);
      }
      setFollowModalOpen(false);
      toast.success(data.message || (data.isFollowing ? 'Berhasil mengikuti organizer!' : 'Berhenti mengikuti organizer'));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah status mengikuti');
    },
  });

  const handleFollowClick = () => {
    if (followerEmail) {
      // Direct toggle if email already known
      followMutation.mutate({ email: followerEmail, name: followerName || (user as any)?.name });
    } else {
      setFollowModalOpen(true);
    }
  };

  const handleModalFollowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followerEmail.trim()) {
      toast.error('Silakan masukkan email Anda');
      return;
    }
    followMutation.mutate({
      email: followerEmail.trim(),
      name: followerName.trim() || undefined,
    });
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success('Link profil berhasil disalin ke clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <Skeleton className="w-full h-48 sm:h-64 rounded-3xl" />
        <div className="flex items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="w-64 h-8" />
            <Skeleton className="w-48 h-4" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profileData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Organizer Tidak Ditemukan</h2>
        <p className="text-slate-500">
          Halaman profil organizer yang Anda cari tidak tersedia atau link salah.
        </p>
        <Link href="/">
          <Button className="mt-4 bg-[#08ADAE] hover:bg-[#068e8f] text-white">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    );
  }

  const { organizer, upcomingEvents = [], pastEvents = [], posts = [], affiliateProgram } = profileData;
  const isFollowing = !!followStatus?.isFollowing;

  // Social Links Formatter
  const instagramUrl = organizer.instagram
    ? organizer.instagram.startsWith('http')
      ? organizer.instagram
      : `https://instagram.com/${organizer.instagram.replace(/^@/, '')}`
    : null;

  const tiktokUrl = organizer.tiktok
    ? organizer.tiktok.startsWith('http')
      ? organizer.tiktok
      : `https://tiktok.com/@${organizer.tiktok.replace(/^@/, '')}`
    : null;

  const youtubeUrl = organizer.youtube
    ? organizer.youtube.startsWith('http')
      ? organizer.youtube
      : `https://youtube.com/${organizer.youtube.startsWith('@') ? organizer.youtube : '@' + organizer.youtube}`
    : null;

  const websiteUrl = organizer.website
    ? organizer.website.startsWith('http')
      ? organizer.website
      : `https://${organizer.website}`
    : null;

  const waUrl = organizer.phone
    ? `https://wa.me/${organizer.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-8 animate-in fade-in duration-300">
      {/* ============================================================ */}
      {/* HERO BANNER & HEADER */}
      {/* ============================================================ */}
      <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-white">
        {/* Cover / Banner */}
        <div className="w-full h-44 sm:h-64 bg-gradient-to-r from-slate-900 via-teal-900 to-[#08ADAE] relative overflow-hidden">
          {organizer.bannerUrl ? (
            <img
              src={organizer.bannerUrl}
              alt={organizer.name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d3434] via-[#094849] to-[#08ADAE] opacity-90 flex items-center justify-end pr-12">
              <Sparkles className="w-32 h-32 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Profile Card Header */}
        <div className="relative px-6 sm:px-8 pb-8 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            {/* Logo Avatar */}
            <div className="flex items-end gap-5">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center flex-shrink-0 bg-slate-50">
                {organizer.logoUrl ? (
                  <img
                    src={organizer.logoUrl}
                    alt={organizer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-teal-50 text-[#08ADAE] font-black text-3xl flex items-center justify-center">
                    {organizer.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name & Badge */}
              <div className="space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {organizer.name}
                  </h1>
                  <CheckCircle2 className="w-6 h-6 text-[#08ADAE] fill-teal-50" />
                </div>
                <p className="text-sm text-slate-500 font-medium">@{organizer.slug}</p>
              </div>
            </div>

            {/* Quick Actions (Follow & Share) */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleFollowClick}
                disabled={followMutation.isPending}
                className={`flex-1 sm:flex-initial rounded-xl px-5 py-2.5 font-semibold transition-all ${
                  isFollowing
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                    : 'bg-[#08ADAE] text-white hover:bg-[#068e8f] shadow-md shadow-teal-500/20'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-2 text-[#08ADAE]" />
                    Mengikuti
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ikuti
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="rounded-xl px-3.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                title="Bagikan Profil"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Bio & Social Stats */}
          <div className="mt-6 space-y-4">
            {organizer.bio ? (
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl whitespace-pre-line">
                {organizer.bio}
              </p>
            ) : (
              <p className="text-slate-400 text-sm italic">
                Penyelenggara acara resmi di platform tiket TAQtix.
              </p>
            )}

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-[#08ADAE]" />
                <span className="font-bold text-slate-900">{organizer.followerCount || 0}</span> Pengikut
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Ticket className="w-4 h-4 text-[#08ADAE]" />
                <span className="font-bold text-slate-900">{organizer.eventCount || 0}</span> Total Acara
              </div>

              {/* Social Icons Bar */}
              <div className="flex items-center gap-2.5 ml-auto">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-600 flex items-center justify-center transition-colors border border-slate-200"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-900 text-slate-600 hover:text-white flex items-center justify-center transition-colors border border-slate-200"
                    title="TikTok"
                  >
                    <TikTokIcon className="w-4 h-4" />
                  </a>
                )}
                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors border border-slate-200"
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-[#08ADAE] flex items-center justify-center transition-colors border border-slate-200"
                    title="Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-colors border border-slate-200"
                    title="Chat WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN TABS: ACARA, KABAR & POST, AFILIASI */}
      {/* ============================================================ */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-3 p-1 bg-slate-100 rounded-2xl h-12">
          <TabsTrigger
            value="events"
            className="rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Acara ({upcomingEvents.length + pastEvents.length})
          </TabsTrigger>
          <TabsTrigger
            value="feed"
            className="rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Kabar & Feed ({posts.length})
          </TabsTrigger>
          <TabsTrigger
            value="affiliate"
            className="rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Afiliasi & Promoter
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------ */}
        {/* TAB 1: ACARA (EVENTS) */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="events" className="mt-8 space-y-10">
          {/* Upcoming Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#08ADAE]" />
                Acara Mendatang
              </h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {upcomingEvents.length} Acara
              </span>
            </div>

            {upcomingEvents.length === 0 ? (
              <Card className="border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center rounded-2xl">
                <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">Belum ada acara mendatang yang dipublikasikan.</p>
                <p className="text-xs text-slate-400 mt-1">Ikuti organizer ini untuk mendapatkan notifikasi saat tiket acara baru dibuka!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((evt: any) => (
                  <Link
                    key={evt.id}
                    href={`/event/${evt.slug}`}
                    className="group rounded-2xl overflow-hidden border border-slate-200/80 bg-white hover:shadow-lg hover:border-teal-300 transition-all duration-200 flex flex-col"
                  >
                    <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                      {evt.bannerUrl ? (
                        <img
                          src={evt.bannerUrl}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                          <Ticket className="w-12 h-12" />
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3 bg-emerald-500 text-white font-semibold shadow-sm">
                        Tiket Tersedia
                      </Badge>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-[#08ADAE] transition-colors line-clamp-2">
                          {evt.title}
                        </h3>
                        <div className="space-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {format(new Date(evt.startDate), 'EEEE, dd MMM yyyy', { locale: localeId })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="line-clamp-1">{evt.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-slate-400 uppercase font-semibold">Mulai Dari</p>
                          <p className="text-base font-extrabold text-[#08ADAE]">
                            {evt.lowestPrice > 0
                              ? `Rp ${Number(evt.lowestPrice).toLocaleString('id-ID')}`
                              : 'Gratis'}
                          </p>
                        </div>
                        <Button size="sm" className="rounded-xl bg-[#08ADAE] hover:bg-[#068e8f] text-white">
                          Beli Tiket
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-600 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-slate-400" />
                Acara Telah Berakhir
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-85">
                {pastEvents.map((evt: any) => (
                  <Link
                    key={evt.id}
                    href={`/event/${evt.slug}`}
                    className="group rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col"
                  >
                    <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden grayscale contrast-125">
                      {evt.bannerUrl && (
                        <img
                          src={evt.bannerUrl}
                          alt={evt.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <Badge className="absolute top-3 right-3 bg-slate-700 text-white font-medium">
                        Berakhir
                      </Badge>
                    </div>

                    <div className="p-4 flex-1 space-y-2">
                      <h3 className="font-semibold text-sm text-slate-800 line-clamp-1">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {format(new Date(evt.startDate), 'dd MMMM yyyy', { locale: localeId })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* TAB 2: KABAR & FEED (UPDATES) */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="feed" className="mt-8 space-y-6">
          {posts.length === 0 ? (
            <Card className="border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center rounded-2xl">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Belum Ada Kabar Baru</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Penyelenggara belum mempublikasikan pengumuman atau kabar terbaru. Ikuti laman ini agar tidak ketinggalan informasi rilis tiket dan jadwal berikutnya!
              </p>
            </Card>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              {posts.map((post: any) => (
                <Card key={post.id} className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow transition-shadow">
                  <CardHeader className="pb-3 pt-5 px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-[#08ADAE]">
                          {organizer.logoUrl ? (
                            <img src={organizer.logoUrl} alt={organizer.name} className="w-full h-full object-cover" />
                          ) : (
                            organizer.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">{organizer.name}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#08ADAE]" />
                          </div>
                          <span className="text-xs text-slate-400">
                            {format(new Date(post.createdAt), 'dd MMMM yyyy, HH:mm', { locale: localeId })}
                          </span>
                        </div>
                      </div>

                      {post.event && (
                        <Link href={`/event/${post.event.slug}`}>
                          <Badge variant="outline" className="border-teal-200 text-[#08ADAE] bg-teal-50/50 text-xs hover:bg-teal-100 transition-colors">
                            {post.event.title} ↗
                          </Badge>
                        </Link>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-6 space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">{post.title}</h4>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-100 max-h-96 bg-slate-50">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* TAB 3: AFILIASI & PROMOTER HUB */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="affiliate" className="mt-8 space-y-6">
          <Card className="rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white">
            <div className="p-8 sm:p-12 space-y-6 max-w-3xl">
              <Badge className="bg-[#08ADAE] text-white hover:bg-[#08ADAE] px-3 py-1 font-semibold">
                Official Promoter & Affiliate Program
              </Badge>
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Raih Penghasilan dengan Menjadi Partner Promosi {organizer.name}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Bagikan link pembelian resmi event kepada komunitas, audiens, dan jejaring Anda. Setiap tiket yang terjual melalui kode/link afiliasi Anda langsung menghasilkan komisi tunai dengan transparansi real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 space-y-2">
                  <DollarSign className="w-6 h-6 text-[#08ADAE]" />
                  <h4 className="font-bold text-sm">Komisi Langsung</h4>
                  <p className="text-xs text-slate-300">Komisi otomatis dihitung per tiket valid yang berhasil dibeli.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 space-y-2">
                  <TrendingUp className="w-6 h-6 text-[#08ADAE]" />
                  <h4 className="font-bold text-sm">Dashboard Real-Time</h4>
                  <p className="text-xs text-slate-300">Pantau jumlah klik, konversi tiket, dan saldo komisi setiap saat.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 space-y-2">
                  <ShieldCheck className="w-6 h-6 text-[#08ADAE]" />
                  <h4 className="font-bold text-sm">Pencairan Mudah</h4>
                  <p className="text-xs text-slate-300">Tarik komisi langsung ke rekening bank lokal Anda tanpa kendala.</p>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link href="/partner/login" className="flex-1 sm:flex-initial">
                  <Button className="w-full sm:w-auto rounded-xl px-8 py-3 bg-[#08ADAE] hover:bg-[#068e8f] text-white font-bold shadow-lg shadow-teal-500/20">
                    Masuk / Daftar Portal Afiliasi
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl border-white/20 text-white hover:bg-white/10">
                      Tanya Kerjasama via WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* MODAL: FOLLOW ORGANIZER VIA EMAIL */}
      {/* ============================================================ */}
      <Dialog open={followModalOpen} onOpenChange={setFollowModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#08ADAE]" />
              Ikuti {organizer.name}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Dapatkan pembaruan langsung tentang rilis tiket, promo spesial, dan kabar event berikutnya melalui email Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModalFollowSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="followerEmail" className="text-xs font-semibold text-slate-700">
                Alamat Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="followerEmail"
                type="email"
                required
                placeholder="nama@email.com"
                value={followerEmail}
                onChange={(e) => setFollowerEmail(e.target.value)}
                className="rounded-xl border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="followerName" className="text-xs font-semibold text-slate-700">
                Nama Lengkap (Opsional)
              </Label>
              <Input
                id="followerName"
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={followerName}
                onChange={(e) => setFollowerName(e.target.value)}
                className="rounded-xl border-slate-300"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFollowModalOpen(false)}
                className="rounded-xl border-slate-300"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={followMutation.isPending}
                className="rounded-xl bg-[#08ADAE] hover:bg-[#068e8f] text-white font-semibold"
              >
                {followMutation.isPending ? 'Menyimpan...' : 'Ikuti Sekarang'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
