'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  expiredAt: string | Date;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ expiredAt, onExpire, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isExpired: boolean;
  }>({
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = new Date(expiredAt).getTime();
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isExpired: true,
        });
        if (onExpire) {
          onExpire();
        }
        return false;
      }

      const totalSec = Math.floor(diff / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;

      setTimeLeft({
        minutes: min,
        seconds: sec,
        totalSeconds: totalSec,
        isExpired: false,
      });
      return true;
    };

    // Hitung pertama kali
    const shouldContinue = calculateTimeLeft();
    if (!shouldContinue) return;

    const interval = setInterval(() => {
      const active = calculateTimeLeft();
      if (!active) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiredAt, onExpire]);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const isWarning = timeLeft.totalSeconds > 0 && timeLeft.totalSeconds <= 180; // Kurang dari 3 menit

  if (timeLeft.isExpired) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200',
          className
        )}
      >
        <AlertTriangle className="h-4 w-4 text-rose-600" />
        <span>Waktu pembayaran telah habis</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors',
        isWarning
          ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
          : 'bg-teal-50 text-[#08B4B5] border-teal-200',
        className
      )}
    >
      <Clock className={cn('h-4 w-4', isWarning ? 'text-amber-600' : 'text-[#08B4B5]')} />
      <span>
        Sisa Waktu:{' '}
        <span className="font-mono text-sm font-extrabold">
          {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </span>
    </div>
  );
}

export default CountdownTimer;
