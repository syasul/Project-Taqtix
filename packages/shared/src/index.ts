/**
 * Status pemesanan tiket oleh pembeli.
 */
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

/**
 * Status tiket fisik atau e-ticket.
 */
export type TicketStatus = 'issued' | 'checked_in' | 'cancelled';

/**
 * Status transaksi pembayaran dari payment gateway (Midtrans/Xendit).
 */
export type PaymentStatus = 'pending' | 'success' | 'expire' | 'fail';

/**
 * Status kelayakan event.
 */
export type EventStatus = 'draft' | 'published' | 'cancelled';

/**
 * Kategori tipe kemitraan afiliasi.
 */
export type PartnerType = 'ambassador' | 'community' | 'influencer' | 'media';

/**
 * Representasi standard error API response.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Pembungkus response berhalaman (pagination).
 */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
