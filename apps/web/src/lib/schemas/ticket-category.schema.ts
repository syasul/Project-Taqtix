import { z } from 'zod';

export const ticketCategorySchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  name: z.string().min(1, 'Nama kategori tiket tidak boleh kosong'),
  price: z.number().nonnegative('Harga tiket tidak boleh negatif'),
  quota: z.number().int().nonnegative('Kuota tiket minimal 0'),
  sold: z.number().int().nonnegative().default(0),
  maxPerOrder: z.number().int().positive('Maksimal tiket per pesanan minimal 1').default(5),
  saleStartAt: z.string().datetime(),
  saleEndAt: z.string().datetime(),
});

export type TicketCategoryModel = z.infer<typeof ticketCategorySchema>;
