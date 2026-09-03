'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  Gift,
  Plus,
  Trophy,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  User,
  PartyPopper,
  Users,
  ArrowLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface DoorprizeWinner {
  id: string;
  winnerName: string;
  drawnAt: string;
  ticketId: string;
}

interface DoorprizeItem {
  id: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  remainingQuantity: number;
  winners: DoorprizeWinner[];
}

export default function DoorprizePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [prizes, setPrizes] = useState<DoorprizeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [isDrawingAnimation, setIsDrawingAnimation] = useState(false);
  const [drawnWinner, setDrawnWinner] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    imageUrl: '',
    quantity: 1,
  });

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/events/${eventId}/doorprize`);
      setPrizes(res.data?.data || res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat data doorprize');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchPrizes();
  }, [eventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      await apiClient.post(`/organizer/events/${eventId}/doorprize`, {
        name: form.name.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        quantity: Number(form.quantity),
      });

      setSuccessMsg('Hadiah doorprize berhasil ditambahkan');
      setIsOpen(false);
      setForm({ name: '', imageUrl: '', quantity: 1 });
      fetchPrizes();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal membuat hadiah doorprize');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraw = async (prizeId: string) => {
    setErrorMsg('');
    setDrawnWinner(null);
    setDrawingId(prizeId);
    setIsDrawingAnimation(true);

    try {
      await new Promise((r) => setTimeout(r, 2000));

      const res = await apiClient.post(`/organizer/events/${eventId}/doorprize/${prizeId}/draw`, {
        excludeWinnersFromPreviousDraws: true,
      });

      const winnerData = res.data?.winner || res.data?.data?.winner;
      setDrawnWinner(winnerData);
      fetchPrizes();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal melakukan pengundian (Pastikan ada penonton check-in)');
    } finally {
      setIsDrawingAnimation(false);
      setDrawingId(null);
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Pengundian Doorprize' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Gift className="h-6 w-6 text-[#08B4B5]" />
            Pengundian Doorprize Acara
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Undi hadiah secara acak dan transparan dari daftar tiket penonton yang telah melakukan check-in di lokasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-0">
              <Plus className="h-4 w-4" />
              <span>Tambah Hadiah Baru</span>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-[#08B4B5]" />
                  Tambah Hadiah Doorprize
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Nama Hadiah *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: iPhone 15, Smart TV 55 Inch"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    URL Foto Hadiah (Opsional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Kuantitas Hadiah *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border-0"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Hadiah'}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => router.push('/dashboard/events')}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
        </div>
      </div>

      {/* Winner Spotlight Banner */}
      {drawnWinner && (
        <div className="p-6 bg-amber-50 border border-amber-300 rounded-2xl text-center space-y-2.5 shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
            <PartyPopper className="h-4 w-4" />
            Selamat Kepada Pemenang!
          </div>
          <h2 className="text-2xl font-black text-slate-900">{drawnWinner.winnerName}</h2>
          <p className="text-sm font-bold text-amber-800">
            Memenangkan Hadiah: {drawnWinner.prizeName}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-mono">
            <span>Email: {drawnWinner.attendeeEmail}</span>
            <span>Telp: {drawnWinner.attendeePhone || '-'}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Prizes Grid */}
      {loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : prizes.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Gift className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-sm">Belum Ada Hadiah Doorprize</h3>
          <p className="text-slate-400 text-xs mt-1">
            Tambahkan hadiah doorprize untuk diundi kepada penonton yang hadir di venue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prizes.map((p) => {
            const isRemaining = p.remainingQuantity > 0;
            const isCurrentlyDrawing = drawingId === p.id && isDrawingAnimation;

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Sisa: {p.remainingQuantity} / {p.quantity}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        isRemaining
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {isRemaining ? 'Tersedia' : 'Habis Terundi'}
                    </span>
                  </div>

                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-36 object-cover rounded-xl border border-slate-100 mb-3"
                    />
                  )}

                  <h4 className="text-base font-bold text-slate-900">{p.name}</h4>

                  {/* Winners history for this prize */}
                  {p.winners?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        Pemenang Terundi ({p.winners.length}):
                      </span>
                      <div className="space-y-1">
                        {p.winners.map((w) => (
                          <div
                            key={w.id}
                            className="text-xs font-semibold text-slate-700 flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100"
                          >
                            <span>{w.winnerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(w.drawnAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    disabled={!isRemaining || isCurrentlyDrawing}
                    onClick={() => handleDraw(p.id)}
                    className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 cursor-pointer border-0"
                  >
                    {isCurrentlyDrawing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Mengundi Pemenang...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Undi Pemenang Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
