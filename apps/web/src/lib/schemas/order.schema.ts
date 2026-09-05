import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'pending',
  'paid',
  'expired',
  'cancelled',
  'refunded',
]);

export const orderItemSchema = z.object({
  id: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  ticketCategoryId: z.string().min(1, 'Ticket Category ID wajib diisi'),
  qty: z.number().int().positive('Jumlah tiket minimal 1'),
  unitPrice: z.number().nonnegative().optional(),
  attendeeName: z.string().min(2, 'Nama peserta minimal 2 karakter').optional(),
  attendeeEmail: z.string().email('Format email peserta tidak valid').optional(),
  attendeePhone: z.string().min(9, 'Nomor HP/WA peserta minimal 9 digit').optional(),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  buyerId: z.string().uuid().optional(),
  status: orderStatusSchema,
  totalAmount: z.number().nonnegative(),
  promoCode: z.string().nullable().optional(),
  discountAmount: z.number().nonnegative().default(0),
  affiliateCode: z.string().nullable().optional(),
  items: z.array(orderItemSchema),
  createdAt: z.string().datetime(),
  expiredAt: z.string().datetime(),
});

/**
 * Schema validasi formulir checkout pembeli.
 */
export const checkoutFormSchema = z.object({
  buyerName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  buyerEmail: z.string().email('Alamat email tidak valid'),
  buyerPhone: z.string().min(9, 'Nomor WhatsApp minimal 9 digit'),
  promoCode: z.string().optional(),
  affiliateCode: z.string().optional(),
});

export const validatePromoSchema = z.object({
  eventId: z.string().min(1, 'Event ID wajib diisi'),
  code: z.string().min(1, 'Kode promo tidak boleh kosong'),
});

export type OrderModel = z.infer<typeof orderSchema>;
export type OrderItemModel = z.infer<typeof orderItemSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type ValidatePromoValues = z.infer<typeof validatePromoSchema>;
