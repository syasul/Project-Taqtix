import { client } from './client';

export interface EventDetail {
  id: string;
  organizerId: string;
  slug: string;
  title: string;
  description: string;
  bannerUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'ended' | 'cancelled';
  requireLogin?: boolean;
  createdAt: string;
  updatedAt: string;
  organizer: {
    name: string;
  };
  ticketCategories?: TicketCategory[];
}

export interface TicketCategory {
  id: string;
  eventId: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
  maxPerOrder: number;
  saleStartAt: string;
  saleEndAt: string;
}

/**
 * Mengambil daftar event publik yang berstatus published.
 */
export async function getPublishedEvents(): Promise<EventDetail[]> {
  return client.get<EventDetail[]>('/events');
}

/**
 * Mengambil detail event publik berdasarkan slug event.
 */
export async function getEventBySlug(slug: string): Promise<EventDetail> {
  return client.get<EventDetail>(`/events/${slug}`);
}

/**
 * Mengambil kategori tiket suatu event.
 */
export async function getEventCategories(eventId: string): Promise<TicketCategory[]> {
  return client.get<TicketCategory[]>(`/events/${eventId}/ticket-categories`);
}
