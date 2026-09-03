'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Code2,
  Plus,
  Key,
  Copy,
  Check,
  Trash2,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface ApiTokenItem {
  id: string;
  name: string;
  tokenPreview: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<ApiTokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([
    'read:events',
    'read:orders',
    'read:attendance',
  ]);
  const [newlyGeneratedToken, setNewlyGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/organizer/api-tokens');
      setTokens(res.data?.data || res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat daftar API token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      const res = await apiClient.post('/organizer/api-tokens', {
        name: name.trim(),
        scopes,
      });

      const rawToken = res.data?.token || res.data?.data?.token;
      setNewlyGeneratedToken(rawToken);
      setName('');
      setIsOpen(false);
      fetchTokens();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal membuat API token (Hanya Owner yang diizinkan)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin mencabut token API ini? Integrasi yang menggunakan token ini akan langsung terputus.')) {
      return;
    }

    try {
      await apiClient.post(`/organizer/api-tokens/${id}/revoke`);
      fetchTokens();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal mencabut token');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleScope = (scope: string) => {
    if (scopes.includes(scope)) {
      setScopes(scopes.filter((s) => s !== scope));
    } else {
      setScopes([...scopes, scope]);
    }
  };

  const breadcrumbs = [
    { label: 'Pengaturan' },
    { label: 'Token Generator (API Access)' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Code2 className="h-6 w-6 text-[#08B4B5]" />
            Token Generator (API Access)
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Buat kunci API untuk menghubungkan sistem tiket Anda dengan Zapier, Make, atau platform internal lainnya.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-0">
            <Plus className="h-4 w-4" />
            <span>Generate Token Baru</span>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="h-5 w-5 text-[#08B4B5]" />
                Generate API Token Baru
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleGenerate} className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Nama Label Token *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Integrasi CRM Zapier"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Cakupan Hak Akses (Scopes)
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {[
                    { id: 'read:events', label: 'read:events (Membaca data event)' },
                    { id: 'read:orders', label: 'read:orders (Membaca histori pesanan)' },
                    { id: 'read:attendance', label: 'read:attendance (Membaca scan & kehadiran)' },
                  ].map((sc) => (
                    <label key={sc.id} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scopes.includes(sc.id)}
                        onChange={() => toggleScope(sc.id)}
                        className="rounded border-slate-300 text-[#08B4B5] focus:ring-0"
                      />
                      <span>{sc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-start gap-2 leading-relaxed">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Hanya peran <strong>Owner</strong> yang dapat membuat dan mencabut token API. Token asli hanya akan ditampilkan 1 kali setelah dibuat.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border-0"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Token Sekarang'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Newly Generated Token Warning Banner */}
      {newlyGeneratedToken && (
        <div className="p-5 bg-teal-50/70 border border-[#08B4B5]/30 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-[#08B4B5] font-bold text-sm">
            <Key className="h-5 w-5" />
            Simpan Token API Anda Sekarang!
          </div>
          <p className="text-slate-600 text-xs">
            Ini adalah satu-satunya kesempatan untuk menyalin token rahasia ini. Setelah Anda menutup atau me-refresh halaman, token lengkap tidak dapat dilihat kembali.
          </p>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
            <code className="text-xs font-mono text-[#08B4B5] font-bold flex-1 break-all select-all">
              {newlyGeneratedToken}
            </code>
            <button
              onClick={() => copyToClipboard(newlyGeneratedToken)}
              className="px-3 py-1.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shrink-0 cursor-pointer border-0"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Token'}</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tokens List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Key className="h-4 w-4 text-[#08B4B5]" />
            Daftar Token API Aktif & Riwayat
          </h3>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Belum ada API token yang dibuat.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Label Nama</th>
                  <th className="py-3.5 px-5">Preview Token</th>
                  <th className="py-3.5 px-5">Izin Scopes</th>
                  <th className="py-3.5 px-5">Terakhir Digunakan</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tokens.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-5 font-bold text-slate-900">{t.name}</td>
                    <td className="py-4 px-5 font-mono text-slate-500">{t.tokenPreview}</td>
                    <td className="py-4 px-5">
                      <div className="flex flex-wrap gap-1">
                        {t.scopes?.map((sc) => (
                          <span
                            key={sc}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200"
                          >
                            {sc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-500 font-mono">
                      {t.lastUsedAt ? (
                        new Date(t.lastUsedAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-slate-400">Belum pernah</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {t.revokedAt ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Dicabut (Revoked)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {!t.revokedAt && (
                        <button
                          onClick={() => handleRevoke(t.id)}
                          className="inline-flex items-center gap-1 py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
