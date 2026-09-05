import { z } from 'zod';

export const partnerTypeSchema = z.enum([
  'ambassador',
  'community',
  'influencer',
  'corporate',
]);

export const partnerSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  name: z.string().min(2, 'Nama partner minimal 2 karakter'),
  type: partnerTypeSchema,
  uniqueCode: z.string().min(2, 'Kode unik minimal 2 karakter'),
  commissionType: z.enum(['percentage', 'fixed']),
  commissionValue: z.number().nonnegative(),
  clicks: z.number().int().nonnegative().default(0),
  conversions: z.number().int().nonnegative().default(0),
  revenueGenerated: z.number().nonnegative().default(0),
  commissionEarned: z.number().nonnegative().default(0),
});

export type PartnerModel = z.infer<typeof partnerSchema>;
export type PartnerType = z.infer<typeof partnerTypeSchema>;
