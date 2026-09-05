import { client } from './client';

export interface OrderItemInput {
  ticketCategoryId: string;
  qty: number;
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
}

export interface CreateOrderInput {
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  promoCode?: string;
  affiliateCode?: string;
  items: OrderItemInput[];
  customFieldAnswers?: Record<string, string>;
  facilities?: Array<{ facilityId: string; qty: number }>;
}

export interface OrderDetail {
  id: string;
  eventId: string;
  buyerId?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded';
  totalAmount: number;
  promoCode?: string | null;
  discountAmount?: number;
  affiliateCode?: string | null;
  createdAt: string;
  expiredAt: string;
  payment?: {
    snapToken?: string;
    redirectUrl?: string;
    status?: string;
  };
  event?: {
    id: string;
    title: string;
    slug: string;
    bannerUrl?: string;
    location?: string;
    startDate?: string;
  };
  items?: Array<{
    id: string;
    ticketCategoryId: string;
    qty: number;
    unitPrice: number;
    attendeeName?: string;
    ticketCategory?: {
      name: string;
      price: number;
    };
  }>;
}

export interface ValidatePromoInput {
  eventId: string;
  code: string;
}

export interface PromoValidationResult {
  valid: boolean;
  code: string;
  discount: number;
  type?: 'percentage' | 'fixed';
}

/**
 * Membuat pesanan tiket baru (reserve quota sementara, expire 10 menit).
 * Wajib mengirimkan header Idempotency-Key sesuai API_CONTRACT.md.
 */
export async function createOrder(
  data: CreateOrderInput,
  idempotencyKey?: string,
): Promise<OrderDetail> {
  const key =
    idempotencyKey ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  return client.post<OrderDetail>('/orders', data, {
    headers: {
      'Idempotency-Key': key,
    },
  });
}

/**
 * Mendapatkan rincian pesanan berdasarkan Order ID.
 */
export async function getOrder(orderId: string): Promise<OrderDetail> {
  return client.get<OrderDetail>(`/orders/${orderId}`);
}

/**
 * Validasi kode promo terhadap event tertentu.
 */
export async function validatePromo(data: ValidatePromoInput): Promise<PromoValidationResult> {
  return client.post<PromoValidationResult>('/orders/validate-promo', data);
}

/**
 * Meminta token pembayaran gateway (Snap/Invoice).
 */
export async function payOrder(orderId: string): Promise<{
  snapToken?: string;
  redirectUrl?: string;
  status?: string;
}> {
  return client.post(`/orders/${orderId}/pay`);
}

/**
 * Mengambil tiket yang diterbitkan untuk suatu pesanan.
 */
export async function getTicketsByOrder(orderId: string): Promise<any[]> {
  return client.get<any[]>(`/tickets/by-order/${orderId}`);
}
