'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { 
  UserCheck, 
  MapPin, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function CrewSelfCheckInPage() {
  const params = useParams();
  const token = params?.token as string;

  const [crewInfo, setCrewInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fetchCrewMe = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/crew/me?token=${token}`);
      if (res.data?.success) {
        setCrewInfo(res.data.data);
        if (res.data.data.status === 'present') {
          setCheckedIn(true);
        }
      }
    } catch (err: any) {
      toast.error('Token tidak valid atau kedaluwarsa');
      setErrorStatus('EXPIRED');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCrewMe();
    }
  }, [token]);

  const handleSelfCheckIn = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung Geolocation');
      return;
    }

    setCheckingIn(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await apiClient.post('/crew/self-check-in', {
            token,
            latitude,
            longitude,
          });

          if (res.data?.success) {
            toast.success('Check-in mandiri berhasil!');
            setCheckedIn(true);
            fetchCrewMe();
          }
        } catch (err: any) {
          const code = err.response?.data?.message;
          if (code === 'OUTSIDE_VENUE_RADIUS') {
            toast.error('Gagal: Anda berada di luar area radius event');
            setErrorStatus('OUTSIDE_RADIUS');
          } else {
            toast.error('Gagal melakukan check-in mandiri');
          }
        } finally {
          setCheckingIn(false);
        }
      },
      (geoError) => {
        toast.error('Gagal mendeteksi lokasi GPS Anda. Pastikan GPS aktif.');
        setCheckingIn(false);
      },
      { enableHighAccuracy: true }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Memproses data crew...</span>
      </div>
    );
  }

  if (errorStatus === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 text-center space-y-4 shadow-2xl">
          <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Sesi Kadaluwarsa</h2>
          <p className="text-sm text-slate-400">
            Tautan check-in mandiri Anda sudah tidak valid atau telah kedaluwarsa. Silakan minta tautan baru kepada PIC divisi Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <UserCheck className="h-7 w-7 text-indigo-400" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">Portal Kehadiran Crew</h2>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
            {crewInfo?.eventName}
          </p>
        </div>

        {/* Crew Info Card */}
        <div className="p-5 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Nama Crew</span>
            <span className="text-slate-200 font-bold">{crewInfo?.name}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Divisi Kerja</span>
            <span className="text-slate-200 font-bold capitalize">{crewInfo?.division}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Posisi/Peran</span>
            <span className="text-slate-200 font-bold">{crewInfo?.role}</span>
          </div>
        </div>

        {/* Check In Action */}
        {checkedIn ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Sudah Check-In</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Absensi kehadiran Anda hari ini telah tercatat di sistem. Terima kasih dan selamat bertugas!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {errorStatus === 'OUTSIDE_RADIUS' && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-2">
                <AlertTriangle className="h-5 w-5 text-rose-400 mx-auto" />
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide">Di Luar Radius Event</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Lokasi GPS Anda menunjukkan Anda berada di luar area radius event yang ditentukan. Silakan mendekat ke lokasi venue untuk check-in.
                </p>
              </div>
            )}

            <button
              onClick={handleSelfCheckIn}
              disabled={checkingIn}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-slate-100 text-sm font-semibold rounded-2xl shadow-lg shadow-indigo-600/10 transition cursor-pointer"
            >
              {checkingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mencari GPS & Validasi...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Check-In Mandiri (GPS)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
