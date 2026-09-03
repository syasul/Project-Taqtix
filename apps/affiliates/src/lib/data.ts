export interface AffiliateEventPromo {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  eventLocation: string;
  promoCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  clicks: number;
  buyersCount: number; // Berapa orang yang menggunakan kode promo
  ticketsSold: number;
  revenueGenerated: number;
  commissionEarned: number;
}

export interface AffiliatePayoutRecord {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'pending' | 'paid' | 'rejected';
  requestedAt: string;
  paidAt?: string | null;
  notes?: string;
}

export let initialAffiliateEvents: AffiliateEventPromo[] = [
  {
    id: 'aff-evt-1',
    eventId: 'evt-1',
    eventTitle: 'Taqwa Movement Concert 2026',
    eventSlug: 'taqwa-movement-2026',
    eventDate: '2026-09-12T13:00:00Z',
    eventLocation: 'Jakarta Convention Center',
    promoCode: 'SYAMSUL-CONCERT',
    discountType: 'percentage',
    discountValue: 10,
    commissionType: 'percentage',
    commissionValue: 10,
    clicks: 1420,
    buyersCount: 86,
    ticketsSold: 114,
    revenueGenerated: 12900000,
    commissionEarned: 1290000,
  },
  {
    id: 'aff-evt-2',
    eventId: 'evt-2',
    eventTitle: 'Kajian Akbar: Menjemput Hidayah',
    eventSlug: 'kajian-akbar-digital-hidayah',
    eventDate: '2026-10-04T08:00:00Z',
    eventLocation: 'Masjid Istiqlal, Jakarta',
    promoCode: 'SYAMSUL-KAJIAN',
    discountType: 'fixed',
    discountValue: 20000,
    commissionType: 'fixed',
    commissionValue: 15000,
    clicks: 3100,
    buyersCount: 140,
    ticketsSold: 185,
    revenueGenerated: 21000000,
    commissionEarned: 2100000,
  },
  {
    id: 'aff-evt-3',
    eventId: 'evt-3',
    eventTitle: 'Fest Hijrah & Halal Culinary 2026',
    eventSlug: 'fest-hijrah-halal-culinary-2026',
    eventDate: '2026-11-20T10:00:00Z',
    eventLocation: 'ICE BSD, Tangerang',
    promoCode: 'SYAMSUL-HIJRAH',
    discountType: 'percentage',
    discountValue: 15,
    commissionType: 'percentage',
    commissionValue: 12.5,
    clicks: 890,
    buyersCount: 45,
    ticketsSold: 62,
    revenueGenerated: 6750000,
    commissionEarned: 843750,
  },
];

export let initialPayouts: AffiliatePayoutRecord[] = [
  {
    id: 'payout-101',
    amount: 1500000,
    bankName: 'BCA',
    accountNumber: '8820192831',
    accountHolder: 'Syamsul Ma’arif',
    status: 'paid',
    requestedAt: '2026-08-18T10:30:00Z',
    paidAt: '2026-08-18T14:15:00Z',
    notes: 'Transfer via BCA KlikBisnis ref #TX8812',
  },
  {
    id: 'payout-102',
    amount: 1000000,
    bankName: 'BCA',
    accountNumber: '8820192831',
    accountHolder: 'Syamsul Ma’arif',
    status: 'pending',
    requestedAt: '2026-09-02T09:00:00Z',
  },
];
