'use client';

import { useState, useCallback } from 'react';

/**
 * Hook untuk mengelola Idempotency-Key (UUID v4) yang stabil selama sesi form/halaman aktif.
 * Dibuat SEKALI saat form dibuka (bukan tiap klik) untuk mencegah order duplikat.
 * Key baru hanya di-generate saat refreshKey() dipanggil secara eksplisit setelah transaksi tuntas.
 */
export function useIdempotency() {
  const generateUuid = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateUuid());

  const refreshKey = useCallback(() => {
    setIdempotencyKey(generateUuid());
  }, []);

  return { idempotencyKey, refreshKey };
}
