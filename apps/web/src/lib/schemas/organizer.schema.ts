import { z } from 'zod';

export const organizerStatusSchema = z.enum(['pending', 'active', 'suspended']);
export const organizerPlanSchema = z.enum(['starter', 'pro', 'enterprise']);

export const organizerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nama EO/brand minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(9, 'Nomor telepon minimal 9 digit'),
  status: organizerStatusSchema,
  plan: organizerPlanSchema,
  createdAt: z.string().datetime(),
  approvedAt: z.string().datetime().nullable(),
  approvedBy: z.string().uuid().nullable(),
});

export type OrganizerModel = z.infer<typeof organizerSchema>;
export type OrganizerStatus = z.infer<typeof organizerStatusSchema>;
export type OrganizerPlan = z.infer<typeof organizerPlanSchema>;
