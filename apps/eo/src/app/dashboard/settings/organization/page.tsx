'use client';

import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useOrganizerRole } from '@/hooks/use-organizer-role';
import { toast } from 'sonner';
import { 
  Building2, 
  Upload, 
  Mail, 
  Phone, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Image as ImageIcon 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function OrganizationSettingsPage() {
  const { isOwner, isLoading: isRoleLoading } = useOrganizerRole();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    contactEmail: '',
    phone: '',
  });

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/organizer/settings/organization');
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          logoUrl: data.logoUrl || '',
          contactEmail: data.contactEmail || '',
          phone: data.phone || '',
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat informasi organisasi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 3MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingLogo(true);
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.data?.url) {
        setForm(prev => ({ ...prev, logoUrl: res.data.data.url }));
        toast.success('Logo berhasil diunggah!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    try {
      setSaving(true);
      const res = await apiClient.patch('/organizer/settings/organization', {
        name: form.name,
        logoUrl: form.logoUrl,
        contactEmail: form.contactEmail,
        phone: form.phone,
      });

      if (res.data?.success) {
        toast.success('Profil organisasi berhasil diperbarui');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data organisasi');
    } finally {
      setSaving(false);
    }
  };

  if (loading || isRoleLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Memuat data organisasi...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#08B4B5]" />
          Pengaturan Organisasi
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Kelola profil identitas organizer, logo resmi, dan saluran komunikasi utama Anda.
        </p>
      </div>

      {!isOwner && (
        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900">Mode Pratinjau (Read-Only)</h4>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Hanya anggota tim dengan role <strong>Owner</strong> yang memiliki izin untuk mengubah nama, logo, dan kontak organisasi.
            </p>
          </div>
        </div>
      )}

      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Identitas Organizer</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Informasi ini akan tertera pada rincian event dan invoice resmi pembeli tiket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Section */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Logo Organisasi</Label>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                  {form.logoUrl ? (
                    <img 
                      src={form.logoUrl} 
                      alt="Logo Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                  )}
                </div>

                {isOwner && (
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border-slate-200 text-xs font-bold flex items-center gap-2"
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#08B4B5]" />
                          <span>Mengunggah...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          <span>Unggah Logo Baru</span>
                        </>
                      )}
                    </Button>
                    <p className="text-[10px] text-slate-400">
                      Format PNG, JPG, WebP, SVG. Maks. 3MB. Disarankan rasio 1:1.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Nama Organisasi */}
            <div className="space-y-2">
              <Label htmlFor="org-name" className="text-xs font-bold text-slate-700">
                Nama Organisasi / Promotor
              </Label>
              <Input
                id="org-name"
                value={form.name}
                disabled={!isOwner || saving}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: TAQtix Live Entertainment"
                className="rounded-xl border-slate-200 text-xs font-medium"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="org-slug" className="text-xs font-bold text-slate-700">
                Slug Unik URL
              </Label>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-xs">
                <span className="px-3 py-2 text-slate-400 bg-slate-100 border-r border-slate-200 select-none">
                  taqtix.id/o/
                </span>
                <input
                  id="org-slug"
                  value={form.slug}
                  disabled
                  className="px-3 py-2 bg-transparent text-slate-500 font-mono w-full cursor-not-allowed outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Slug organisasi dibuat saat pendaftaran dan tidak dapat diubah secara mandiri.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Email Kontak */}
              <div className="space-y-2">
                <Label htmlFor="org-email" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Email Kontak Publik
                </Label>
                <Input
                  id="org-email"
                  type="email"
                  value={form.contactEmail}
                  disabled={!isOwner || saving}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="support@organizer.id"
                  className="rounded-xl border-slate-200 text-xs font-medium"
                />
              </div>

              {/* Nomor HP */}
              <div className="space-y-2">
                <Label htmlFor="org-phone" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  Nomor HP / WhatsApp
                </Label>
                <Input
                  id="org-phone"
                  value={form.phone}
                  disabled={!isOwner || saving}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="081234567890"
                  className="rounded-xl border-slate-200 text-xs font-medium"
                />
              </div>
            </div>

            {isOwner && (
              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={saving || uploadingLogo}
                  className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold px-6 py-2.5 h-auto cursor-pointer shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
