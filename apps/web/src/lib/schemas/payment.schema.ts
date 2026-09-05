import { z } from 'zod';

export const paymentStatusSchema = z.enum([
  'pending',
  'success',
  'failed',
  'expired',
]);

export const paymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  provider: z.enum(['midtrans', 'xendit']),
  externalId: z.string(),
  status: paymentStatusSchema,
  amount: z.number().positive(),
  paidAt: z.string().datetime().nullable(),
});

export type PaymentModel = z.infer<typeof paymentSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
