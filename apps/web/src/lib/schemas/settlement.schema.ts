import { z } from 'zod';

export const settlementStatusSchema = z.enum(['pending', 'processing', 'paid']);

export const settlementSchema = z.object({
  id: z.string().uuid(),
  organizerId: z.string().uuid(),
  eventId: z.string().uuid(),
  grossRevenue: z.number().nonnegative(),
  platformFee: z.number().nonnegative(),
  affiliateCommissionTotal: z.number().nonnegative(),
  netAmount: z.number().nonnegative(),
  status: settlementStatusSchema,
  paidAt: z.string().datetime().nullable(),
  paidBy: z.string().uuid().nullable(),
});

export type SettlementModel = z.infer<typeof settlementSchema>;
export type SettlementStatus = z.infer<typeof settlementStatusSchema>;
