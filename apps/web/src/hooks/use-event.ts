import { useQuery, useMutation } from '@tanstack/react-query';
import { getPublishedEvents, getEventBySlug, getEventCategories } from '@/lib/api/events';
import { validatePromo, ValidatePromoInput } from '@/lib/api/orders';

/**
 * Hook untuk mengambil daftar seluruh event publik yang aktif.
 */
export function usePublishedEvents() {
  return useQuery({
    queryKey: ['events', 'published'],
    queryFn: () => getPublishedEvents(),
    staleTime: 60 * 1000, // 1 menit
  });
}

/**
 * Hook untuk mengambil detail event publik berdasarkan slug.
 */
export function useEvent(slug: string) {
  return useQuery({
    queryKey: ['events', 'detail', slug],
    queryFn: () => getEventBySlug(slug),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook untuk mengambil daftar kategori tiket suatu event.
 */
export function useEventCategories(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'categories'],
    queryFn: () => getEventCategories(eventId),
    enabled: !!eventId,
  });
}

/**
 * Hook mutasi untuk validasi kode promo event.
 */
export function useValidatePromo() {
  return useMutation({
    mutationFn: (payload: ValidatePromoInput) => validatePromo(payload),
  });
}
