import { z } from 'zod';

export const eventStatusSchema = z.enum(['draft', 'published', 'ended', 'cancelled']);

export const eventSchema = z.object({
  id: z.string().uuid(),
  organizerId: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(3, 'Judul event minimal 3 karakter'),
  description: z.string(),
  bannerUrl: z.string().url('Format URL banner tidak valid'),
  location: z.string().min(1, 'Lokasi tidak boleh kosong'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: eventStatusSchema,
  requireLogin: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type EventModel = z.infer<typeof eventSchema>;
export type EventStatus = z.infer<typeof eventStatusSchema>;
