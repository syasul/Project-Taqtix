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
  AlertTriangle,
  Clock,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CrewSelfCheckInPage() {
  const params = useParams();
  const token = params?.token as string;

  const [crewInfo, setCrewInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedInTime, setCheckedInTime] = useState<string | null>(null);
  
  // Specific status states
  const [errorType, setErrorType] = useState<
    'SESSION_EXPIRED' | 'OUTSIDE_VENUE_RADIUS' | 'PERMISSION_DENIED' | 'LOCATION_UNAVAILABLE' | null
  >(null);

  const fetchCrewMe = async () => {
    try {
      setLoading(true);
      setErrorType(null);
      const res = await apiClient.get(`/crew/me?token=${token}`);
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setCrewInfo(data);
        if (data.status === 'present' || data.checkedInAt) {
          setCheckedIn(true);
          setCheckedInTime(data.checkedInAt || new Date().toISOString());
        }
      }
    } catch (err: any) {
      const code = err.response?.data?.error?.code || err.response?.data?.message;
      if (code === 'SESSION_EXPIRED' || err.response?.status === 404 || err.response?.status === 410) {
        setErrorType('SESSION_EXPIRED');
      } else {
        setErrorType('SESSION_EXPIRED');
      }
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
    setErrorType(null);

    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung deteksi lokasi (Geolocation)');
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
            setCheckedInTime(new Date().toISOString());
            fetchCrewMe();
          }
        } catch (err: any) {
          const code = err.response?.data?.error?.code || err.response?.data?.message;
          if (code === 'OUTSIDE_VENUE_RADIUS') {
            setErrorType('OUTSIDE_VENUE_RADIUS');
            toast.error('Kamu belum berada di lokasi venue');
          } else if (code === 'ALREADY_CHECKED_IN') {
            setCheckedIn(true);
            toast.info('Kamu sudah tercatat check-in sebelumnya');
          } else if (code === 'SESSION_EXPIRED') {
            setErrorType('SESSION_EXPIRED');
          } else {
            toast.error(err.response?.data?.message || 'Gagal melakukan check-in');
          }
        } finally {
          setCheckingIn(false);
        }
      },
      (geoError) => {
        setCheckingIn(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setErrorType('PERMISSION_DENIED');
          toast.error('Izin lokasi ditolak oleh browser');
        } else {
          setErrorType('LOCATION_UNAVAILABLE');
          toast.error('Gagal mendeteksi koordinat GPS. Pastikan GPS aktif.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 space-y-3">
        <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Memverifikasi sesi kru...</span>
      </div>
    );
  }

  // Handle SESSION_EXPIRED
  if (errorType === 'SESSION_EXPIRED') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-sm w-full p-8 text-center space-y-4 shadow-2xl">
          <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">Sesi Tidak Berlaku</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Link ini sudah tidak berlaku, hubungi panitia
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-slate-800 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white">
        {/* Header Minimal */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center mx-auto text-[#08B4B5]">
            <UserCheck className="h-7 w-7" />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Check-In Mandiri Kru
          </h1>
          <div className="inline-block px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-xs font-bold text-[#08B4B5] max-w-xs truncate">
            {crewInfo?.eventName || 'Event TAQtix'}
          </div>
        </div>

        {/* Crew Info Details */}
        <div className="p-4 sm:p-5 bg-slate-900/80 border border-slate-700/80 rounded-2xl space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Nama Kru</span>
            <span className="text-white font-bold text-sm">{crewInfo?.name || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Divisi</span>
            <span className="text-white font-bold capitalize">{crewInfo?.division || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Role / Posisi</span>
            <span className="text-white font-bold">{crewInfo?.role || 'Staff'}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Jam Shift
            </span>
            <span className="text-[#08B4B5] font-mono font-bold">
              {crewInfo?.shiftHours || 'Hari H (Full Shift)'}
            </span>
          </div>
        </div>

        {/* Errors & Alerts */}
        {errorType === 'PERMISSION_DENIED' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-2">
            <AlertTriangle className="h-5 w-5 text-amber-400 mx-auto" />
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Izin Lokasi Ditolak</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Browser Anda menolak izin lokasi. Harap izinkan akses lokasi (GPS) di pengaturan browser/HP Anda lalu coba lagi.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelfCheckIn}
              className="rounded-xl border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs font-bold mt-1"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Coba Lagi
            </Button>
          </div>
        )}

        {errorType === 'OUTSIDE_VENUE_RADIUS' && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-2">
            <AlertTriangle className="h-5 w-5 text-rose-400 mx-auto" />
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide">Di Luar Lokasi Venue</h4>
            <p className="text-xs text-slate-200 leading-relaxed font-semibold">
              Kamu belum berada di lokasi venue
            </p>
            <p className="text-[10px] text-slate-400">
              Silakan mendekat ke area pintu masuk atau venue acara yang telah ditentukan panitia.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelfCheckIn}
              className="rounded-xl border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-bold mt-1"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Periksa Ulang Lokasi
            </Button>
          </div>
        )}

        {/* Action Button / Already Checked In State */}
        {checkedIn ? (
          <div className="space-y-3">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-1.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
              <h4 className="text-xs font-bold text-emerald-400">Presensi Kehadiran Terverifikasi</h4>
              {checkedInTime && (
                <p className="text-[11px] text-slate-400 font-mono">
                  Waktu Check-In: {new Date(checkedInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </p>
              )}
            </div>

            <Button
              disabled
              className="w-full py-3.5 bg-emerald-600/60 text-white text-xs font-bold rounded-2xl cursor-not-allowed shadow-none border-0 h-auto"
            >
              <span>Sudah Check-in ✓</span>
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSelfCheckIn}
            disabled={checkingIn}
            className="w-full py-4 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-sm font-bold rounded-2xl shadow-lg transition cursor-pointer border-0 h-auto"
          >
            {checkingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Mendeteksi Lokasi GPS...</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                <span>Check In Sekarang</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
