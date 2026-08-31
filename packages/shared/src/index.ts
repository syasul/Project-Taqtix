/**
 * Status pemesanan tiket oleh pembeli.
 */
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'expired';

/**
 * Status tiket fisik atau e-ticket.
 */
export type TicketStatus = 'valid' | 'checked_in' | 'cancelled';

/**
 * Status transaksi pembayaran dari payment gateway (Midtrans/Xendit).
 */
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

/**
 * Status kelayakan event.
 */
export type EventStatus = 'draft' | 'published' | 'ended' | 'cancelled';

/**
 * Kategori tipe kemitraan afiliasi.
 */
export type PartnerType = 'ambassador' | 'community' | 'influencer' | 'corporate';

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

// --- ADDENDUM 2 MODELS ---

export interface Voucher {
  id: string;
  organizerId: string;
  eventId: string | null;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  usageLimit: number | null;
  usageCount: number;
  maxDiscountAmount: number | null;
  validFrom: string;
  validUntil: string;
  applicableEventIds: string[] | null;
  status: 'active' | 'inactive' | 'expired';
  createdAt?: string;
  updatedAt?: string;
}

export interface CashTransaction {
  id: string;
  eventId: string;
  type: 'ticket_sale' | 'merchandise_sale' | 'facility_sale' | 'other';
  amount: number;
  relatedOrderId: string | null;
  relatedPosTransactionId: string | null;
  recordedBy: string;
  note: string | null;
  createdAt: string;
}

export interface ApiToken {
  id: string;
  organizerId: string;
  name: string;
  tokenPreview: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdBy: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface CustomFormField {
  id: string;
  eventId: string;
  label: string;
  fieldType: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  options: string[] | null;
  required: boolean;
  order: number;
}

export interface EventFacility {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  quota: number | null;
  sold: number;
  applicableTicketCategoryIds: string[] | null;
}

export interface LineUpItem {
  id: string;
  eventId: string;
  name: string;
  photoUrl: string | null;
  performTime: string | null;
  stage: string | null;
  order: number;
}

export interface TicketTransfer {
  id: string;
  ticketId: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  toPhone: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  requestToken: string;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export interface PosTransactionItem {
  type: 'ticket' | 'facility';
  refId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface PosTransaction {
  id: string;
  eventId: string;
  items: PosTransactionItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'qris' | 'debit';
  cashierId: string;
  buyerName: string | null;
  buyerPhone: string | null;
  createdAt: string;
}

export interface DoorprizeItem {
  id: string;
  eventId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  remainingQuantity: number;
}

export interface DoorprizeWinner {
  id: string;
  doorprizeItemId: string;
  ticketId: string;
  winnerName: string;
  drawnAt: string;
  drawnBy: string;
}

