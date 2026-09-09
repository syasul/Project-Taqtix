'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useOrganizerRole } from '@/hooks/use-organizer-role';
import { toast } from 'sonner';
import { 
  Code2, 
  ExternalLink, 
  Info, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function IntegrationsSettingsPage() {
  const { isOwner, isLoading: isRoleLoading } = useOrganizerRole();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    metaPixelId: '',
    tiktokPixelId: '',
    gaTrackingId: '',
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/organizer/settings/integrations');
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setForm({
          metaPixelId: data.metaPixelId || '',
          tiktokPixelId: data.tiktokPixelId || '',
          gaTrackingId: data.gaTrackingId || '',
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat konfigurasi integrasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    try {
      setSaving(true);
      const res = await apiClient.patch('/organizer/settings/integrations', form);
      if (res.data?.success) {
        toast.success('Pengaturan integrasi pixel & tracking berhasil disimpan');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan integrasi');
    } finally {
      setSaving(false);
    }
  };

  if (loading || isRoleLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Memuat konfigurasi integrasi...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Code2 className="h-6 w-6 text-[#08B4B5]" />
          Integrasi Tracking & Pixel
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Hubungkan Meta Pixel, TikTok Pixel, dan Google Analytics untuk lacak konversi kampanye iklan Anda.
        </p>
      </div>

      {!isOwner && (
        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900">Mode Pratinjau (Read-Only)</h4>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Hanya anggota tim dengan role <strong>Owner</strong> yang dapat mengubah token dan ID tracking integrasi.
            </p>
          </div>
        </div>
      )}

      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Marketing Pixels & Analytics</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Pixel ID yang Anda daftarkan di sini akan disematkan secara otomatis di landing page publik event milik organizer Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Meta Pixel */}
            <div className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <Label htmlFor="meta-pixel" className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  Meta (Facebook & Instagram) Pixel ID
                </Label>
                <a
                  href="https://www.facebook.com/business/help/952192354843755"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#08B4B5] hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Cara menemukan Pixel ID
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              </div>
              <Input
                id="meta-pixel"
                value={form.metaPixelId}
                disabled={!isOwner || saving}
                onChange={(e) => setForm({ ...form, metaPixelId: e.target.value })}
                placeholder="Misal: 123456789012345"
                className="rounded-xl border-slate-200 text-xs font-mono font-medium bg-white"
              />
              <p className="text-[10px] text-slate-400">
                Lacak event standar Facebook seperti ViewContent, InitiateCheckout, dan Purchase secara otomatis.
              </p>
            </div>

            {/* TikTok Pixel */}
            <div className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <Label htmlFor="tiktok-pixel" className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-black inline-block" />
                  TikTok Ads Pixel ID
                </Label>
                <a
                  href="https://ads.tiktok.com/help/article/get-started-with-pixel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#08B4B5] hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Dokumentasi TikTok Pixel
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              </div>
              <Input
                id="tiktok-pixel"
                value={form.tiktokPixelId}
                disabled={!isOwner || saving}
                onChange={(e) => setForm({ ...form, tiktokPixelId: e.target.value })}
                placeholder="Misal: C1A2B3C4D5E6F7G8"
                className="rounded-xl border-slate-200 text-xs font-mono font-medium bg-white"
              />
              <p className="text-[10px] text-slate-400">
                Optimalkan penargetan iklan TikTok dan catat performa ROAS tiket event Anda.
              </p>
            </div>

            {/* Google Analytics GA4 */}
            <div className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <Label htmlFor="ga-tracking" className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Google Analytics 4 Measurement ID
                </Label>
                <a
                  href="https://support.google.com/analytics/answer/9539598"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#08B4B5] hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Panduan GA4 ID
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              </div>
              <Input
                id="ga-tracking"
                value={form.gaTrackingId}
                disabled={!isOwner || saving}
                onChange={(e) => setForm({ ...form, gaTrackingId: e.target.value })}
                placeholder="Misal: G-XXXXXXXXXX"
                className="rounded-xl border-slate-200 text-xs font-mono font-medium bg-white"
              />
              <p className="text-[10px] text-slate-400">
                ID properti web GA4 yang berawalan dengan &quot;G-&quot; untuk memantau perilaku pengunjung dan sumber lalu lintas.
              </p>
            </div>

            {isOwner && (
              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold px-6 py-2.5 h-auto cursor-pointer shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Menyimpan Integrasi...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      <span>Simpan ID Integrasi</span>
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
