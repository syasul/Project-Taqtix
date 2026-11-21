'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Users,
  Search,
  Download,
  Loader2,
  Mail,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Follower {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
}

export default function FollowersManagementPage() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFollowers();
  }, [search]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/organizers/followers', {
        params: { search: search.trim() || undefined },
      });
      const data = res.data?.data || [];
      setFollowers(data);
      setTotal(res.data?.meta?.total ?? data.length);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat daftar pengikut');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (followers.length === 0) {
      toast.error('Tidak ada data pengikut untuk diekspor');
      return;
    }

    const headers = ['Email', 'Nama', 'Tanggal Mengikuti'];
    const rows = followers.map((f) => [
      `"${f.email}"`,
      `"${f.name || ''}"`,
      `"${format(new Date(f.createdAt), 'yyyy-MM-dd HH:mm:ss')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `followers-taqtix-${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV berhasil diunduh');
  };

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-[#08B4B5]" />
              Pengikut (Followers)
            </h1>
            <Badge className="bg-teal-50 text-[#08B4B5] border-teal-200 font-bold px-2.5 py-0.5 rounded-full">
              {total} Pengikut
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Daftar pengguna dan audiens yang mengikuti akun organizer Anda untuk mendapatkan update kabar & tiket acara.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          disabled={followers.length === 0}
          variant="outline"
          className="rounded-xl border-slate-200 text-xs font-bold px-4 py-2.5 h-auto shadow-2xs self-start sm:self-auto flex items-center gap-2 text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          <span>Ekspor CSV (Email List)</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative max-w-sm">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Cari email atau nama pengikut..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl border-slate-200 text-xs bg-white"
        />
      </div>

      {/* Table / List */}
      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
            <span className="text-xs font-semibold text-slate-400">Memuat data pengikut...</span>
          </div>
        ) : followers.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Pengikut</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {search
                ? 'Tidak ditemukan pengikut yang cocok dengan kata kunci pencarian Anda.'
                : 'Bagikan laman profil EO dan event Anda ke media sosial agar audiens dapat mulai mengikuti perkembangan tiket Anda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Pengikut</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Tanggal Mengikuti</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {followers.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-50 text-[#08B4B5] font-bold flex items-center justify-center text-xs border border-teal-100">
                          {(f.name || f.email).substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">
                          {f.name || 'Pengunjung TAQtix'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{f.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {format(new Date(f.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Aktif
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
