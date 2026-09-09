'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useOrganizerRole } from '@/hooks/use-organizer-role';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Building, 
  Hash, 
  User, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function PaymentSettingsPage() {
  const router = useRouter();
  const { role, isLoading: isRoleLoading } = useOrganizerRole();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
  });

  const isAuthorized = role === 'owner' || role === 'finance';

  useEffect(() => {
    if (!isRoleLoading) {
      if (!isAuthorized) {
        toast.error('Akses ditolak: Hanya Owner atau Finance yang dapat mengakses rekening settlement.');
        router.replace('/dashboard');
        return;
      }
      fetchPaymentData();
    }
  }, [role, isRoleLoading, isAuthorized, router]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/organizer/settings/payment');
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setForm({
          bankName: data.bankName || '',
          bankAccountNumber: data.bankAccountNumber || '',
          bankAccountHolder: data.bankAccountHolder || '',
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat data rekening');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiClient.patch('/organizer/settings/payment', form);
      if (res.data?.success) {
        toast.success('Informasi rekening settlement berhasil disimpan');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data rekening settlement');
    } finally {
      setSaving(false);
    }
  };

  if (isRoleLoading || (!isAuthorized && !isRoleLoading)) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Lock className="h-8 w-8 text-slate-300" />
        <span className="text-xs font-semibold text-slate-400">Memeriksa izin akses...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Memuat data rekening...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-[#08B4B5]" />
          Rekening Settlement & Pencairan
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Daftarkan rekening bank resmi organisasi untuk penerimaan bagi hasil penjualan tiket acara.
        </p>
      </div>

      <div className="p-4 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[#08B4B5] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700">
          <span className="font-bold text-slate-900">Perhatian Verifikasi Bank</span>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Pastikan nama pemilik rekening sama persis dengan nama legal atau perwakilan promotor yang telah diverifikasi di sistem TAQtix. Kesalahan nomor rekening dapat menunda proses settlement otomatis.
          </p>
        </div>
      </div>

      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Informasi Rekening Bank</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Pencairan hasil penjualan tiket bersih akan ditransfer ke rekening di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="bank-name" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-slate-400" />
                Nama Bank
              </Label>
              <Input
                id="bank-name"
                value={form.bankName}
                disabled={saving}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="Misal: BCA, Mandiri, BNI, BRI, Bank Syariah Indonesia"
                className="rounded-xl border-slate-200 text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-number" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                Nomor Rekening
              </Label>
              <Input
                id="bank-number"
                value={form.bankAccountNumber}
                disabled={saving}
                onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                placeholder="Misal: 1234567890"
                className="rounded-xl border-slate-200 text-xs font-mono font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-holder" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Atas Nama Rekening (Account Holder)
              </Label>
              <Input
                id="bank-holder"
                value={form.bankAccountHolder}
                disabled={saving}
                onChange={(e) => setForm({ ...form, bankAccountHolder: e.target.value })}
                placeholder="Misal: PT TAQTIX KREASI NUSANTARA"
                className="rounded-xl border-slate-200 text-xs font-medium uppercase"
                required
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold px-6 py-2.5 h-auto cursor-pointer shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Menyimpan Rekening...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span>Simpan Rekening Settlement</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
