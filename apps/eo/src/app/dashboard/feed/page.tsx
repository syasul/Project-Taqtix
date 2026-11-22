'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Grid3X3,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Sparkles,
  ExternalLink,
  Upload,
  Clock,
  Eye,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Edit3,
  Globe,
  Instagram,
  Youtube,
  Phone,
  Mail,
  Users,
  MessageSquare,
  Camera,
  X,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { compressImage } from '@/lib/image-compressor';

// TikTok Icon SVG
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    width="14"
    height="14"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 4.84 1.55v-3.5a4.84 4.84 0 0 1-1.07-.11Z" />
  </svg>
);

interface OrganizerProfile {
  id?: string;
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  startDate?: string;
  endDate?: string;
  venueName?: string;
  bannerUrl?: string | null;
  status?: string;
}

interface OrganizerPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  eventId?: string | null;
  createdAt: string;
  event?: EventItem | null;
}

export default function InstagramProfileStudioPage() {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [posts, setPosts] = useState<OrganizerPost[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'timeline' | 'events'>('grid');

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<OrganizerPost | null>(null);

  // States for operations
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isUploadingPostImg, setIsUploadingPostImg] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Hidden refs for quick direct uploads
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const postImgInputRef = useRef<HTMLInputElement>(null);

  // Forms
  const [profileForm, setProfileForm] = useState({
    name: '',
    logoUrl: '',
    bannerUrl: '',
    bio: '',
    contactEmail: '',
    phone: '',
    website: '',
    instagram: '',
    tiktok: '',
    youtube: '',
  });

  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    imageUrl: '',
    eventId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [profileRes, postsRes, eventsRes, followersRes] = await Promise.all([
        apiClient.get('/organizer/settings/organization').catch(() => null),
        apiClient.get('/organizers/feed').catch(() => null),
        apiClient.get('/organizer/events').catch(() => null),
        apiClient.get('/organizers/followers').catch(() => null),
      ]);

      if (profileRes?.data?.data) {
        const orgData = profileRes.data.data;
        setProfile(orgData);
        setProfileForm({
          name: orgData.name || '',
          logoUrl: orgData.logoUrl || '',
          bannerUrl: orgData.bannerUrl || '',
          bio: orgData.bio || '',
          contactEmail: orgData.contactEmail || '',
          phone: orgData.phone || '',
          website: orgData.website || '',
          instagram: orgData.instagram || '',
          tiktok: orgData.tiktok || '',
          youtube: orgData.youtube || '',
        });
      }

      if (postsRes?.data) {
        const postList = postsRes.data?.data || postsRes.data || [];
        setPosts(Array.isArray(postList) ? postList : []);
      }

      if (eventsRes?.data) {
        const evList =
          eventsRes.data?.data?.events ||
          eventsRes.data?.events ||
          eventsRes.data?.data ||
          eventsRes.data ||
          [];
        setEvents(Array.isArray(evList) ? evList : []);
      }

      if (followersRes?.data) {
        const total =
          followersRes.data?.meta?.total ??
          (Array.isArray(followersRes.data?.data) ? followersRes.data.data.length : 0);
        setFollowersCount(total);
      }
    } catch (err: any) {
      console.error('Failed to load profile or feed data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick Direct Upload for Avatar
  const handleDirectAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      let processed = file;
      try {
        processed = await compressImage(file, {
          maxWidth: 600,
          maxHeight: 600,
          quality: 0.85,
          mimeType: 'image/webp',
        });
      } catch {
        processed = file;
      }

      const formData = new FormData();
      formData.append('file', processed);

      const res = await apiClient.post('/upload', formData);
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setProfile((prev) => (prev ? { ...prev, logoUrl: url } : prev));
        setProfileForm((prev) => ({ ...prev, logoUrl: url }));
        await apiClient.patch('/organizer/settings/organization', { logoUrl: url });
        toast.success('Foto profil berhasil diperbarui!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto profil');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Quick Direct Upload for Banner Cover
  const handleDirectBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBanner(true);
      let processed = file;
      try {
        processed = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 600,
          quality: 0.85,
          mimeType: 'image/webp',
        });
      } catch {
        processed = file;
      }

      const formData = new FormData();
      formData.append('file', processed);

      const res = await apiClient.post('/upload', formData);
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setProfile((prev) => (prev ? { ...prev, bannerUrl: url } : prev));
        setProfileForm((prev) => ({ ...prev, bannerUrl: url }));
        await apiClient.patch('/organizer/settings/organization', { bannerUrl: url });
        toast.success('Sampul header berhasil diperbarui!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah sampul');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Save Full Profile & Bio
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error('Nama organizer tidak boleh kosong');
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await apiClient.patch('/organizer/settings/organization', profileForm);
      const updated = res.data?.data || res.data;
      setProfile((prev) => ({ ...prev, ...updated }));
      toast.success('Profil & Bio berhasil diperbarui!');
      setIsEditProfileOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Post Image Upload
  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 10MB');
      return;
    }

    try {
      setIsUploadingPostImg(true);
      let processed = file;
      try {
        processed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
          mimeType: 'image/webp',
        });
      } catch {
        processed = file;
      }

      const formData = new FormData();
      formData.append('file', processed);

      const res = await apiClient.post('/upload', formData);
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setPostForm((prev) => ({ ...prev, imageUrl: url }));
        toast.success('Gambar postingan berhasil diunggah!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah gambar');
    } finally {
      setIsUploadingPostImg(false);
    }
  };

  // Create New Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.content.trim()) {
      toast.error('Judul dan caption postingan wajib diisi');
      return;
    }

    try {
      setIsSubmittingPost(true);
      const payload: any = {
        title: postForm.title.trim(),
        content: postForm.content.trim(),
      };
      if (postForm.imageUrl) payload.imageUrl = postForm.imageUrl.trim();
      if (postForm.eventId) payload.eventId = postForm.eventId;

      const res = await apiClient.post('/organizers/feed', payload);
      toast.success(res.data?.message || 'Postingan berhasil dipublikasikan!');
      setIsCreateOpen(false);
      setPostForm({ title: '', content: '', imageUrl: '', eventId: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mempublikasikan postingan');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus postingan ini?')) return;

    try {
      setDeletingPostId(postId);
      await apiClient.delete(`/organizers/feed/${postId}`);
      toast.success('Postingan berhasil dihapus');
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus postingan');
    } finally {
      setDeletingPostId(null);
    }
  };

  const publicUrl = profile?.slug
    ? `https://taqtix.id/eo/${profile.slug}`
    : 'https://taqtix.id';

  const handleCopyLink = () => {
    if (!profile?.slug) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Tautan profil berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Hidden inputs for direct media changes */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleDirectAvatarUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleDirectBannerUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ============================================================== */}
      {/* 1. INSTAGRAM PROFILE HERO & BIO CARD */}
      {/* ============================================================== */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        {/* Banner Cover Header */}
        <div className="relative h-44 sm:h-56 md:h-64 w-full bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 group">
          {profile?.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Cover Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-1">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs font-medium">Belum ada foto sampul profil</span>
            </div>
          )}

          {/* Banner Edit Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isUploadingBanner}
              onClick={() => bannerInputRef.current?.click()}
              className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-lg text-xs font-medium"
            >
              {isUploadingBanner ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Camera className="h-3.5 w-3.5 mr-1.5" />
              )}
              {profile?.bannerUrl ? 'Ganti Sampul' : 'Tambah Sampul'}
            </Button>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            {/* Avatar & Identitas EO */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
              {/* Instagram Story Gradient Ring Avatar */}
              <div className="relative group">
                <div className="p-[3px] bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] rounded-full shadow-xl">
                  <div className="p-1 bg-card rounded-full">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-muted flex items-center justify-center text-2xl font-bold text-foreground">
                      {profile?.logoUrl ? (
                        <img
                          src={profile.logoUrl}
                          alt={profile?.name || 'EO Logo'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{profile?.name?.slice(0, 2).toUpperCase() || 'EO'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Instant Change Photo Badge */}
                <button
                  type="button"
                  title="Ganti Foto Profil"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-card"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Name & Handle */}
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {profile?.name || 'Organizer TAQtix'}
                  </h1>
                  <CheckCircle2 className="h-5 w-5 text-blue-500 fill-blue-500/10 shrink-0" />
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                  <span className="font-mono font-medium">@{profile?.slug || 'organizer'}</span>
                  <Badge variant="outline" className="text-[11px] font-normal py-0 px-2 bg-muted/50">
                    Official Partner
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditProfileOpen(true)}
                className="font-medium text-xs sm:text-sm h-9 shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                Edit Profil & Bio
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="font-semibold text-xs sm:text-sm h-9 bg-primary text-primary-foreground shadow-sm hover:shadow"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Buat Postingan
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title="Salin Link Laman Profil"
                className="h-9 w-9"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>

              {profile?.slug && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Lihat Laman Publik"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Instagram Stats Row */}
          <div className="grid grid-cols-3 divide-x border-y py-3.5 my-6 bg-muted/20 rounded-xl">
            <div className="text-center px-2">
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {posts.length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Postingan</div>
            </div>
            <Link
              href="/dashboard/followers"
              className="text-center px-2 hover:opacity-80 transition-opacity"
            >
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {followersCount}
              </div>
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                Pengikut <ChevronRight className="h-3 w-3" />
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className="text-center px-2 hover:opacity-80 transition-opacity"
            >
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {events.length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Acara / Event</div>
            </button>
          </div>

          {/* Bio & Social Media Links */}
          <div className="space-y-3 max-w-3xl">
            {profile?.bio ? (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground italic flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Bio profil belum diisi. Klik tombol &ldquo;Edit Profil & Bio&rdquo; untuk menambahkan
                deskripsi organizer Anda.
              </p>
            )}

            {/* Social Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {profile?.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-foreground font-medium hover:bg-muted transition-colors border"
                >
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span>{profile.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {profile?.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/10 to-purple-500/10 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  <span>@{profile.instagram.replace(/^@/, '')}</span>
                </a>
              )}
              {profile?.tiktok && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-foreground font-medium hover:bg-muted transition-colors border"
                >
                  <TikTokIcon className="h-3.5 w-3.5" />
                  <span>@{profile.tiktok.replace(/^@/, '')}</span>
                </a>
              )}
              {profile?.youtube && (
                <a
                  href={profile.youtube.startsWith('http') ? profile.youtube : `https://youtube.com/${profile.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  <Youtube className="h-3.5 w-3.5" />
                  <span>YouTube</span>
                </a>
              )}
              {profile?.phone && (
                <a
                  href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{profile.phone}</span>
                </a>
              )}
              {profile?.contactEmail && (
                <a
                  href={`mailto:${profile.contactEmail}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground font-medium hover:bg-muted transition-colors border"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{profile.contactEmail}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. INSTAGRAM TABS (Grid / Timeline / Acara) */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-1 sm:space-x-3">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'grid'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            <span>Grid Postingan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'timeline'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <List className="h-4 w-4" />
            <span>Timeline Kabar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'events'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Acara & Tiket ({events.length})</span>
          </button>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="hidden sm:inline-flex text-xs h-8 bg-primary text-primary-foreground font-medium"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Kabar Baru
        </Button>
      </div>

      {/* ============================================================== */}
      {/* 3. CONTENT AREA */}
      {/* ============================================================== */}

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Memuat studio profil & konten...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: INSTAGRAM 3X3 SQUARE GRID */}
          {activeTab === 'grid' && (
            <div>
              {posts.length === 0 ? (
                <div className="py-16 text-center border rounded-2xl bg-card space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <Grid3X3 className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground text-base">Belum Ada Postingan</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                      Bagikan foto teaser konser, poster lineup, rundown, atau kabar rilis tiket kepada
                      pengikut Anda.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Buat Postingan Pertama
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 md:gap-5">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-muted border cursor-pointer select-none shadow-xs hover:shadow-md transition-all"
                    >
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white">
                          <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">
                            {format(new Date(post.createdAt), 'dd MMM yyyy')}
                          </span>
                          <p className="font-semibold text-xs sm:text-sm line-clamp-3 leading-snug">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-teal-400">
                            <Sparkles className="h-3 w-3" />
                            <span>Kabar EO</span>
                          </div>
                        </div>
                      )}

                      {/* Instagram Hover Scrim */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 sm:p-4 text-white">
                        <div className="flex justify-between items-start">
                          {post.event ? (
                            <Badge className="bg-primary/90 text-primary-foreground text-[10px] border-none py-0.5 px-2 font-normal line-clamp-1 max-w-[80%]">
                              {post.event.title}
                            </Badge>
                          ) : <div />}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            disabled={deletingPostId === post.id}
                            title="Hapus Postingan"
                            className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white shadow-xs transition-colors"
                          >
                            {deletingPostId === post.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-tight">
                            {post.title}
                          </h4>
                          <p className="text-[11px] text-white/80 line-clamp-1 font-normal">
                            {post.content}
                          </p>
                          <span className="text-[10px] text-white/60 block pt-1">
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                              locale: localeId,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE FEED VIEW */}
          {activeTab === 'timeline' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {posts.length === 0 ? (
                <div className="py-16 text-center border rounded-2xl bg-card space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <List className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-foreground text-base">Belum Ada Kabar</h3>
                  <Button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Buat Kabar Baru
                  </Button>
                </div>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden border shadow-xs rounded-2xl">
                    {/* Header Author */}
                    <div className="p-4 flex items-center justify-between border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-xs border">
                          {profile?.logoUrl ? (
                            <img
                              src={profile.logoUrl}
                              alt={profile.name || 'EO'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{profile?.name?.slice(0, 2).toUpperCase() || 'EO'}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground">
                              {profile?.name || 'Organizer'}
                            </span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                              locale: localeId,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPost(post)}
                          title="Buka Popup"
                          className="h-8 w-8 text-muted-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletingPostId === post.id}
                          title="Hapus Postingan"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        >
                          {deletingPostId === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Post Image (if any) */}
                    {post.imageUrl && (
                      <div
                        onClick={() => setSelectedPost(post)}
                        className="w-full max-h-[500px] overflow-hidden bg-black/5 cursor-pointer"
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-auto object-contain max-h-[500px] mx-auto hover:opacity-95 transition-opacity"
                        />
                      </div>
                    )}

                    {/* Content & Caption */}
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      <h3 className="font-bold text-base sm:text-lg text-foreground leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line font-normal">
                        {post.content}
                      </p>

                      {/* Attached Event Card */}
                      {post.event && (
                        <div className="pt-2">
                          <Link
                            href={`/dashboard/events/${post.event.id}`}
                            className="flex items-center justify-between p-3 rounded-xl border bg-muted/40 hover:bg-muted/70 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Calendar className="h-4 w-4 text-primary shrink-0" />
                              <div className="text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                  Terkait Acara
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
                                  {post.event.title}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* TAB 3: SHOWCASE ACARA & EVENT */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Acara Diselenggarakan</h3>
                  <p className="text-xs text-muted-foreground">
                    Semua event yang terdaftar dan dikelola oleh organizer Anda.
                  </p>
                </div>
                <Link
                  href="/dashboard/events/new"
                  className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs font-semibold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Buat Event Baru
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="py-16 text-center border rounded-2xl bg-card space-y-4">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Belum ada acara yang dibuat.</p>
                  <Link
                    href="/dashboard/events/new"
                    className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs font-semibold transition-colors"
                  >
                    Mulai Buat Acara
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((ev) => (
                    <Card key={ev.id} className="overflow-hidden border rounded-xl hover:shadow-md transition-shadow">
                      <div className="h-36 bg-muted relative">
                        {ev.bannerUrl ? (
                          <img
                            src={ev.bannerUrl}
                            alt={ev.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                        <div className="absolute top-2.5 right-2.5">
                          <Badge className="bg-black/70 text-white text-[10px] font-medium backdrop-blur-xs border-none">
                            {ev.status || 'PUBLISHED'}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-semibold text-sm line-clamp-1 text-foreground">
                          {ev.title}
                        </h4>
                        {ev.startDate && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-primary shrink-0" />
                            <span>{format(new Date(ev.startDate), 'dd MMMM yyyy, HH:mm', { locale: localeId })}</span>
                          </p>
                        )}
                        <div className="pt-2 flex items-center justify-between border-t text-xs">
                          <Link
                            href={`/dashboard/events/${ev.id}`}
                            className="text-primary hover:underline font-semibold"
                          >
                            Kelola Event
                          </Link>
                          <a
                            href={`https://taqtix.id/events/${ev.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          >
                            Laman Publik <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 4. MODAL: EDIT PROFIL & BIO (INSTAGRAM STYLE) */}
      {/* ============================================================== */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Atur Profil, Bio & Media Sosial</DialogTitle>
            <DialogDescription className="text-xs">
              Sesuaikan informasi identitas, foto profil, deskripsi bio, dan tautan media sosial organizer
              Anda yang akan tampil di laman publik taqtix.id.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-5 pt-2">
            {/* Foto Profil & Sampul Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
              {/* Foto Profil */}
              <div className="space-y-2 text-center sm:text-left">
                <Label className="text-xs font-semibold">Foto Profil (Logo EO)</Label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border flex items-center justify-center shrink-0">
                    {profileForm.logoUrl ? (
                      <img
                        src={profileForm.logoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">LOGO</span>
                    )}
                  </div>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="text-xs h-8"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 mr-1" />
                      )}
                      Unggah Logo
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-1">Disarankan format persegi 1:1</p>
                  </div>
                </div>
              </div>

              {/* Sampul Header */}
              <div className="space-y-2 text-center sm:text-left">
                <Label className="text-xs font-semibold">Foto Sampul (Banner Header)</Label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted border flex items-center justify-center shrink-0">
                    {profileForm.bannerUrl ? (
                      <img
                        src={profileForm.bannerUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">SAMPUL</span>
                    )}
                  </div>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isUploadingBanner}
                      className="text-xs h-8"
                    >
                      {isUploadingBanner ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 mr-1" />
                      )}
                      Unggah Sampul
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-1">Disarankan rasio 16:9 / 3:1</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nama Organizer */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Nama Organizer <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: Soundrenaline Project / Taqtix Live"
                required
              />
            </div>

            {/* Bio Organizer (Instagram Style) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="text-xs font-semibold">
                  Bio Profil Organizer
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {profileForm.bio?.length || 0}/500 karakter
                </span>
              </div>
              <Textarea
                id="bio"
                rows={4}
                maxLength={500}
                value={profileForm.bio}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tulis bio singkat tentang organizer Anda... (Gunakan baris baru untuk format ala profil Instagram)"
                className="resize-none text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Format baris baru (enter) akan dipertahankan persis seperti bio akun Instagram.
              </p>
            </div>

            {/* Kontak & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs font-semibold">
                  Website Resmi
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    className="pl-9 text-xs"
                    placeholder="https://brandanda.com"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Nomor Kontak / WhatsApp
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    className="pl-9 text-xs"
                    placeholder="081234567890"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Akun Media Sosial */}
            <div className="space-y-3 pt-1">
              <Label className="text-xs font-semibold block">Tautan Media Sosial</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="relative">
                    <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-rose-500" />
                    <Input
                      className="pl-9 text-xs"
                      placeholder="Instagram (@username)"
                      value={profileForm.instagram}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, instagram: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">
                      <TikTokIcon />
                    </span>
                    <Input
                      className="pl-9 text-xs"
                      placeholder="TikTok (@username)"
                      value={profileForm.tiktok}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, tiktok: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Youtube className="absolute left-3 top-2.5 h-4 w-4 text-red-500" />
                    <Input
                      className="pl-9 text-xs"
                      placeholder="YouTube Channel / URL"
                      value={profileForm.youtube}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, youtube: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditProfileOpen(false)}
                disabled={isSavingProfile}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="text-xs font-semibold bg-primary text-primary-foreground"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan Profil'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* 5. MODAL: BUAT POSTINGAN BARU (INSTAGRAM POST CREATOR) */}
      {/* ============================================================== */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Buat Postingan Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Posting gambar, pengumuman, teaser artis/lineup, atau jadwal tiket langsung ke laman
              organizer Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePost} className="space-y-4 pt-2">
            <input
              type="file"
              ref={postImgInputRef}
              onChange={handlePostImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Media Upload Area (Instagram Square/Card Style) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Foto / Gambar Postingan</Label>
              {postForm.imageUrl ? (
                <div className="relative aspect-video sm:aspect-square max-h-72 w-full rounded-xl overflow-hidden border bg-black group">
                  <img
                    src={postForm.imageUrl}
                    alt="Preview Postingan"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => postImgInputRef.current?.click()}
                      className="h-8 text-xs bg-black/70 hover:bg-black text-white"
                    >
                      Ganti Foto
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => setPostForm((prev) => ({ ...prev, imageUrl: '' }))}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => postImgInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-all space-y-2"
                >
                  {isUploadingPostImg ? (
                    <div className="space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">
                        Sedang mengompres & mengunggah gambar...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-primary hover:underline">
                          Pilih foto postingan
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          PNG, JPG, WebP maksimal 10MB (Otomatis dikompres web-optimized)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Judul Postingan */}
            <div className="space-y-1.5">
              <Label htmlFor="post-title" className="text-xs font-semibold">
                Judul Postingan / Headline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="post-title"
                value={postForm.title}
                onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Contoh: Phase 1 Lineup Resmi Diumumkan!"
                required
              />
            </div>

            {/* Caption Lengkap */}
            <div className="space-y-1.5">
              <Label htmlFor="post-caption" className="text-xs font-semibold">
                Caption / Cerita Postingan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="post-caption"
                rows={5}
                value={postForm.content}
                onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Tulis caption lengkap, informasi jam tiket, rundown, atau arahan untuk pembeli..."
                className="text-sm resize-none"
                required
              />
            </div>

            {/* Tag Acara Terkait */}
            <div className="space-y-1.5">
              <Label htmlFor="post-event" className="text-xs font-semibold">
                Sematkan Acara Terkait (Opsional)
              </Label>
              <select
                id="post-event"
                value={postForm.eventId}
                onChange={(e) => setPostForm((prev) => ({ ...prev, eventId: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">-- Tidak terkait acara spesifik --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmittingPost}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingPost}
                className="text-xs font-semibold bg-primary text-primary-foreground"
              >
                {isSubmittingPost ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Mempublikasikan...
                  </>
                ) : (
                  'Publikasikan Sekarang'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* 6. MODAL: DETAIL POSTINGAN (INSTAGRAM POPUP STYLE) */}
      {/* ============================================================== */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border rounded-2xl">
          {selectedPost && (
            <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh]">
              {/* Left Column: Post Media */}
              <div className="bg-black flex items-center justify-center min-h-[300px] md:min-h-[480px] max-h-[550px] overflow-hidden">
                {selectedPost.imageUrl ? (
                  <img
                    src={selectedPost.imageUrl}
                    alt={selectedPost.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-white/80 space-y-3">
                    <Sparkles className="h-10 w-10 text-primary mx-auto" />
                    <h3 className="font-bold text-lg">{selectedPost.title}</h3>
                    <p className="text-xs text-white/60">Postingan teks tanpa lampiran gambar</p>
                  </div>
                )}
              </div>

              {/* Right Column: Author Header & Caption */}
              <div className="flex flex-col justify-between p-5 sm:p-6 bg-card overflow-y-auto">
                <div className="space-y-4">
                  {/* Author Header */}
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border flex items-center justify-center font-bold text-xs">
                        {profile?.logoUrl ? (
                          <img
                            src={profile.logoUrl}
                            alt={profile.name || 'EO'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{profile?.name?.slice(0, 2).toUpperCase() || 'EO'}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-foreground">
                            {profile?.name || 'Organizer'}
                          </span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          @{profile?.slug || 'organizer'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(selectedPost.createdAt), 'dd MMM yyyy')}
                    </span>
                  </div>

                  {/* Post Title & Full Caption */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-base sm:text-lg text-foreground leading-snug">
                      {selectedPost.title}
                    </h3>
                    <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line font-normal">
                      {selectedPost.content}
                    </div>
                  </div>

                  {/* Attached Event */}
                  {selectedPost.event && (
                    <div className="pt-2">
                      <div className="p-3 rounded-xl border bg-muted/40 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                          Acara Terkait
                        </span>
                        <div className="font-semibold text-xs sm:text-sm text-foreground">
                          {selectedPost.event.title}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-6 border-t mt-6 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePost(selectedPost.id)}
                    disabled={deletingPostId === selectedPost.id}
                    className="text-xs h-8"
                  >
                    {deletingPostId === selectedPost.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    Hapus Postingan
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPost(null)}
                    className="text-xs h-8"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
