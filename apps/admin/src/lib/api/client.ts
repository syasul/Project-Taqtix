export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.taqtix.id/v1';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

// ==========================================
// MOCK DATA LAYER FOR DEV & STANDALONE DEMO
// ==========================================
let mockOrganizers = [
  {
    id: 'org-1',
    name: 'Taqwa Media Group',
    email: 'contact@taqwamedia.id',
    phone: '08123456789',
    status: 'active' as const,
    plan: 'pro' as const,
    segment: 'event_builder' as const,
    bankAccount: 'BCA 8891234455 a.n Taqwa Media',
    createdAt: '2026-08-01T10:00:00Z',
    approvedAt: '2026-08-01T12:00:00Z',
    approvedBy: 'admin@taqtix.id',
    eventCount: 4,
  },
  {
    id: 'org-2',
    name: 'Nusantara Hijrah Fest',
    email: 'info@hijrahfest.id',
    phone: '08987654321',
    status: 'pending' as const,
    plan: 'starter' as const,
    segment: 'campus_community' as const,
    bankAccount: 'Mandiri 137000987654 a.n Hijrah Fest',
    createdAt: '2026-08-20T14:30:00Z',
    approvedAt: null,
    approvedBy: null,
    eventCount: 0,
  },
  {
    id: 'org-3',
    name: 'Dunia Halal Expo',
    email: 'hello@duniahalal.com',
    phone: '08112233445',
    status: 'active' as const,
    plan: 'enterprise' as const,
    segment: 'enterprise' as const,
    bankAccount: 'BNI 0987654321 a.n PT Dunia Halal Global',
    createdAt: '2026-07-15T09:00:00Z',
    approvedAt: '2026-07-15T11:00:00Z',
    approvedBy: 'admin@taqtix.id',
    eventCount: 2,
  },
  {
    id: 'org-4',
    name: 'Amal Bersama Foundation',
    email: 'charity@amalbersama.org',
    phone: '08556677889',
    status: 'suspended' as const,
    plan: 'starter' as const,
    segment: 'campus_community' as const,
    bankAccount: 'BSI 7112233445 a.n Yayasan Amal Bersama',
    createdAt: '2026-05-10T08:00:00Z',
    approvedAt: '2026-05-10T10:00:00Z',
    approvedBy: 'admin@taqtix.id',
    eventCount: 1,
  },
];

let mockPartners = [
  {
    id: 'ptn-1',
    name: 'Komunitas Hijrah Millennials',
    email: 'partner.hijrah@millennials.org',
    type: 'COMMUNITY',
    uniqueCode: 'HIJRAH2026',
    promoCode: 'HIJRAH10',
    commissionType: 'percentage',
    commissionValue: 10,
    clicks: 1420,
    conversions: 86,
    revenueGenerated: 12900000,
    commissionEarned: 1290000,
    createdAt: '2026-08-05T09:00:00Z',
    eventId: 'evt-1',
    event: {
      id: 'evt-1',
      title: 'Taqwa Movement Concert 2026',
    },
  },
  {
    id: 'ptn-2',
    name: 'Influencer Dakwah Gaul',
    email: 'business@dakwahgaul.com',
    type: 'INFLUENCER',
    uniqueCode: 'DAKWAHGAUL',
    promoCode: 'GAUL50K',
    commissionType: 'fixed',
    commissionValue: 15000,
    clicks: 3100,
    conversions: 140,
    revenueGenerated: 21000000,
    commissionEarned: 2100000,
    createdAt: '2026-08-10T14:20:00Z',
    eventId: 'evt-2',
    event: {
      id: 'evt-2',
      title: 'Kajian Akbar: Menjemput Hidayah',
    },
  },
  {
    id: 'ptn-3',
    name: 'Halal Travel Club Indonesia',
    email: 'kerjasama@halaltravel.id',
    type: 'CORPORATE',
    uniqueCode: 'HALALTRIP',
    promoCode: 'TRIP2026',
    commissionType: 'percentage',
    commissionValue: 12.5,
    clicks: 890,
    conversions: 45,
    revenueGenerated: 6750000,
    commissionEarned: 843750,
    createdAt: '2026-08-15T11:00:00Z',
    eventId: 'evt-1',
    event: {
      id: 'evt-1',
      title: 'Taqwa Movement Concert 2026',
    },
  },
];

let mockEvents = [
  {
    id: 'evt-1',
    title: 'Taqwa Movement Concert 2026',
    slug: 'taqwa-movement-2026',
    organizerName: 'Taqwa Media Group',
    location: 'Jakarta Convention Center',
    status: 'published',
    startDate: '2026-09-12T13:00:00Z',
    endDate: '2026-09-12T22:00:00Z',
    ticketsSold: 450,
    quota: 650,
  },
  {
    id: 'evt-2',
    title: 'Kajian Akbar: Menjemput Hidayah',
    slug: 'kajian-akbar-digital-hidayah',
    organizerName: 'Taqwa Media Group',
    location: 'Masjid Istiqlal, Jakarta',
    status: 'published',
    startDate: '2026-10-04T08:00:00Z',
    endDate: '2026-10-04T12:00:00Z',
    ticketsSold: 920,
    quota: 1200,
  },
  {
    id: 'evt-3',
    title: 'Fest Hijrah & Halal Culinary 2026',
    slug: 'fest-hijrah-halal-culinary-2026',
    organizerName: 'Nusantara Hijrah Fest',
    location: 'ICE BSD, Tangerang',
    status: 'draft',
    startDate: '2026-11-20T10:00:00Z',
    endDate: '2026-11-22T22:00:00Z',
    ticketsSold: 0,
    quota: 4000,
  },
];

let mockOrders = [
  {
    id: 'ord-1029',
    eventTitle: 'Taqwa Movement Concert 2026',
    buyerName: 'Muhammad Ilyas',
    buyerEmail: 'ilyas@example.com',
    buyerPhone: '081299990000',
    status: 'paid',
    totalAmount: 300000,
    discountAmount: 0,
    createdAt: '2026-08-22T15:10:00Z',
    expiredAt: '2026-08-22T15:25:00Z',
    items: [{ id: 'item-1', name: 'Regular Ticket', qty: 2, price: 150000 }],
  },
  {
    id: 'ord-1030',
    eventTitle: 'Kajian Akbar: Menjemput Hidayah',
    buyerName: 'Siti Aminah',
    buyerEmail: 'aminah@outlook.com',
    buyerPhone: '085711112222',
    status: 'pending',
    totalAmount: 75000,
    discountAmount: 0,
    createdAt: '2026-08-22T17:05:00Z',
    expiredAt: '2026-08-22T17:20:00Z',
    items: [{ id: 'item-2', name: 'Infaq Dakwah - Prioritas', qty: 1, price: 75000 }],
  },
  {
    id: 'ord-1031',
    eventTitle: 'Taqwa Movement Concert 2026',
    buyerName: 'Budi Santoso',
    buyerEmail: 'budi@domain.com',
    buyerPhone: '081388887777',
    status: 'expired',
    totalAmount: 150000,
    discountAmount: 0,
    createdAt: '2026-08-21T10:00:00Z',
    expiredAt: '2026-08-21T10:15:00Z',
    items: [{ id: 'item-3', name: 'Regular Ticket', qty: 1, price: 150000 }],
  },
];

let mockSettlements = [
  {
    id: 'set-1',
    eventTitle: 'Taqwa Movement Concert 2026',
    organizerName: 'Taqwa Media Group',
    grossRevenue: 67500000,
    platformFee: 3375000,
    affiliateCommissionTotal: 5000000,
    netAmount: 59125000,
    status: 'pending',
    paidAt: null,
    paidBy: null,
  },
  {
    id: 'set-2',
    eventTitle: 'Kajian Akbar: Menjemput Hidayah',
    organizerName: 'Taqwa Media Group',
    grossRevenue: 38000000,
    platformFee: 1900000,
    affiliateCommissionTotal: 0,
    netAmount: 36100000,
    status: 'paid',
    paidAt: '2026-08-18T16:00:00Z',
    paidBy: 'admin@taqtix.id',
  },
];

let mockLeads = [
  {
    id: 'lead-1',
    name: 'Faisal Rahman',
    organizationName: 'Festival Kuliner Syariah 2026',
    email: 'faisal@kulinersyariah.id',
    phone: '08129876543',
    message: 'Kami ingin konsultasi skema enterprise ticketing & cashless POS untuk 50.000 pengunjung.',
    status: 'new',
    assignedTo: null,
    createdAt: '2026-08-24T10:15:00Z',
  },
  {
    id: 'lead-2',
    name: 'Dewi Lestari',
    organizationName: 'Universitas Indonesia Islamic Book Fair',
    email: 'dewi.lestari@ui.ac.id',
    phone: '08561234567',
    message: 'Tertarik menggunakan TAQtix untuk event tahunan kampus kami dengan kuota 15.000 mahasiswa.',
    status: 'contacted',
    assignedTo: 'admin@taqtix.id',
    createdAt: '2026-08-22T08:30:00Z',
  },
];

let mockAuditLogs = [
  {
    id: 'log-1',
    adminEmail: 'admin@taqtix.id',
    action: 'APPROVE_ORGANIZER',
    target: 'Taqwa Media Group (org-1)',
    timestamp: '2026-08-01T12:00:00Z',
  },
  {
    id: 'log-2',
    adminEmail: 'admin@taqtix.id',
    action: 'MARK_SETTLEMENT_PAID',
    target: 'Kajian Akbar (set-2)',
    timestamp: '2026-08-18T16:00:00Z',
  },
];

function handleMockRequest(method: string, path: string, body?: any): ApiResponse {
  const url = path.split('?')[0]; // strip query parameters

  // DASHBOARD
  if (url === '/admin/dashboard') {
    const activeOrgs = mockOrganizers.filter((o) => o.status === 'active').length;
    const publishedEvents = mockEvents.filter((e) => e.status === 'published').length;
    const totalRev = mockSettlements.reduce((sum, s) => sum + s.grossRevenue, 0);
    const totalFee = mockSettlements.reduce((sum, s) => sum + s.platformFee, 0);
    const pendingOrgs = mockOrganizers.filter((o) => o.status === 'pending').length;
    const pendingSets = mockSettlements.filter((s) => s.status === 'pending').length;

    return {
      success: true,
      data: {
        metrics: {
          activeOrganizers: activeOrgs,
          publishedEvents,
          platformRevenue: totalRev,
          feesCollected: totalFee,
          pendingApprovals: pendingOrgs,
          pendingSettlements: pendingSets,
        },
        recentSales: [
          { name: 'Minggu 1', sales: 120, revenue: 18000000 },
          { name: 'Minggu 2', sales: 250, revenue: 37500000 },
          { name: 'Minggu 3', sales: 380, revenue: 57000000 },
          { name: 'Minggu 4', sales: 480, revenue: 72000000 },
        ],
      },
    };
  }

  // ORGANIZERS CRUD
  if (url === '/admin/organizers' && method === 'GET') {
    return { success: true, data: mockOrganizers };
  }

  if (url === '/admin/organizers' && method === 'POST') {
    const newId = `org-${Date.now().toString().slice(-4)}`;
    const newOrg = {
      id: newId,
      name: body.name || 'Organizer Baru',
      email: body.email || `eo-${newId}@taqtix.id`,
      phone: body.phone || '08123456789',
      status: body.status || 'active',
      plan: body.plan || 'starter',
      segment: body.segment || 'event_builder',
      bankAccount: body.bankAccount || '',
      createdAt: new Date().toISOString(),
      approvedAt: body.status === 'active' ? new Date().toISOString() : null,
      approvedBy: body.status === 'active' ? 'admin@taqtix.id' : null,
      eventCount: 0,
    };
    mockOrganizers.unshift(newOrg);
    mockAuditLogs.unshift({
      id: `log-${Date.now()}`,
      adminEmail: 'admin@taqtix.id',
      action: 'CREATE_ORGANIZER',
      target: `${newOrg.name} (${newOrg.id})`,
      timestamp: new Date().toISOString(),
    });
    return { success: true, data: newOrg };
  }

  if (url.startsWith('/admin/organizers/') && method === 'PATCH') {
    const parts = url.split('/');
    const id = parts[3];
    const subAction = parts[4]; // e.g. 'approve', 'suspend', 'plan', 'segment'
    const orgIndex = mockOrganizers.findIndex((o) => o.id === id);

    if (orgIndex === -1) {
      throw new ApiError('Organizer tidak ditemukan', 'NOT_FOUND', 404);
    }

    const org = mockOrganizers[orgIndex];

    if (subAction === 'approve') {
      org.status = 'active';
      org.approvedAt = new Date().toISOString();
      org.approvedBy = 'admin@taqtix.id';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'APPROVE_ORGANIZER',
        target: `${org.name} (${org.id})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: org };
    }

    if (subAction === 'suspend') {
      org.status = 'suspended';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'SUSPEND_ORGANIZER',
        target: `${org.name} (${org.id})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: org };
    }

    if (subAction === 'plan') {
      const oldPlan = org.plan;
      org.plan = body?.plan || org.plan;
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'CHANGE_ORGANIZER_PLAN',
        target: `${org.name} (${org.id}): ${oldPlan} -> ${body?.plan}`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: org };
    }

    if (subAction === 'segment') {
      org.segment = body?.segment !== undefined ? body.segment : org.segment;
      org.plan = body?.plan !== undefined ? body.plan : org.plan;
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'UPDATE_ORGANIZER_SEGMENT',
        target: `${org.name} (${org.id})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: org };
    }

    // Direct update of full organizer entity
    mockOrganizers[orgIndex] = {
      ...org,
      ...body,
      id: org.id, // preserve id
    };
    mockAuditLogs.unshift({
      id: `log-${Date.now()}`,
      adminEmail: 'admin@taqtix.id',
      action: 'UPDATE_ORGANIZER_DETAILS',
      target: `${mockOrganizers[orgIndex].name} (${org.id})`,
      timestamp: new Date().toISOString(),
    });
    return { success: true, data: mockOrganizers[orgIndex] };
  }

  if (url.startsWith('/admin/organizers/') && method === 'POST') {
    const parts = url.split('/');
    const id = parts[3];
    const subAction = parts[4];
    const org = mockOrganizers.find((o) => o.id === id);
    if (!org) throw new ApiError('Organizer tidak ditemukan', 'NOT_FOUND', 404);

    if (subAction === 'approve') {
      org.status = 'active';
      org.approvedAt = new Date().toISOString();
      org.approvedBy = 'admin@taqtix.id';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'APPROVE_ORGANIZER',
        target: `${org.name} (${org.id})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: org };
    }

    if (subAction === 'suspend') {
      org.status = 'suspended';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'SUSPEND_ORGANIZER',
        target: `${org.name} (${org.id})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: org };
    }
  }

  if (url.startsWith('/admin/organizers/') && method === 'DELETE') {
    const id = url.split('/')[3];
    const org = mockOrganizers.find((o) => o.id === id);
    if (org) {
      mockOrganizers = mockOrganizers.filter((o) => o.id !== id);
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'DELETE_ORGANIZER',
        target: `${org.name} (${org.id})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: { id } };
    }
    throw new ApiError('Organizer tidak ditemukan', 'NOT_FOUND', 404);
  }

  // PARTNERS CRUD
  if (url === '/admin/partners' && method === 'GET') {
    return { success: true, data: mockPartners };
  }

  if (url === '/admin/partners' && method === 'POST') {
    const newId = `ptn-${Date.now().toString().slice(-4)}`;
    const linkedEvent = mockEvents.find((e) => e.id === body.eventId) || mockEvents[0];
    const newPartner = {
      id: newId,
      name: body.name || 'Partner Baru',
      email: body.email || `partner-${newId}@example.com`,
      type: body.type || 'COMMUNITY',
      uniqueCode: (body.uniqueCode || `REF-${newId}`).toUpperCase(),
      promoCode: body.promoCode ? body.promoCode.toUpperCase() : null,
      commissionType: body.commissionType || 'percentage',
      commissionValue: Number(body.commissionValue) || 10,
      clicks: 0,
      conversions: 0,
      revenueGenerated: 0,
      commissionEarned: 0,
      createdAt: new Date().toISOString(),
      eventId: linkedEvent.id,
      event: {
        id: linkedEvent.id,
        title: linkedEvent.title,
      },
    };
    mockPartners.unshift(newPartner);
    mockAuditLogs.unshift({
      id: `log-${Date.now()}`,
      adminEmail: 'admin@taqtix.id',
      action: 'CREATE_PARTNER',
      target: `${newPartner.name} (${newPartner.uniqueCode})`,
      timestamp: new Date().toISOString(),
    });
    return { success: true, data: newPartner };
  }

  if (url.startsWith('/admin/partners/') && method === 'PATCH') {
    const id = url.split('/')[3];
    const idx = mockPartners.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const p = mockPartners[idx];
      let linkedEvent = p.event;
      if (body.eventId && body.eventId !== p.eventId) {
        const foundEvt = mockEvents.find((e) => e.id === body.eventId);
        if (foundEvt) {
          linkedEvent = { id: foundEvt.id, title: foundEvt.title };
        }
      }
      mockPartners[idx] = {
        ...p,
        ...body,
        event: linkedEvent,
        id: p.id,
      };
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'UPDATE_PARTNER',
        target: `${mockPartners[idx].name} (${mockPartners[idx].uniqueCode})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: mockPartners[idx] };
    }
    throw new ApiError('Partner tidak ditemukan', 'NOT_FOUND', 404);
  }

  if (url.startsWith('/admin/partners/') && method === 'DELETE') {
    const id = url.split('/')[3];
    const p = mockPartners.find((ptn) => ptn.id === id);
    if (p) {
      mockPartners = mockPartners.filter((ptn) => ptn.id !== id);
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'DELETE_PARTNER',
        target: `${p.name} (${p.uniqueCode})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: { id } };
    }
    throw new ApiError('Partner tidak ditemukan', 'NOT_FOUND', 404);
  }

  // EVENTS
  if (url === '/admin/events') {
    return { success: true, data: mockEvents };
  }

  if (url.startsWith('/admin/events/') && url.endsWith('/force-unpublish')) {
    const id = url.split('/')[3];
    const event = mockEvents.find((e) => e.id === id);
    if (event) {
      event.status = 'draft';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'FORCE_UNPUBLISH_EVENT',
        target: `${event.title} (${event.id})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: event };
    }
  }

  // ORDERS
  if (url === '/admin/orders') {
    return { success: true, data: mockOrders };
  }

  // SETTLEMENTS
  if (url === '/admin/settlements') {
    return { success: true, data: mockSettlements };
  }

  if (url.startsWith('/admin/settlements/') && url.endsWith('/mark-paid')) {
    const id = url.split('/')[3];
    const set = mockSettlements.find((s) => s.id === id);
    if (set) {
      set.status = 'paid';
      set.paidAt = new Date().toISOString();
      set.paidBy = 'admin@taqtix.id';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'MARK_SETTLEMENT_PAID',
        target: `${set.eventTitle} (${set.id})`,
        timestamp: new Date().toISOString(),
      });
      return { success: true, data: set };
    }
  }

  // LEADS
  if (url === '/admin/leads' && method === 'GET') {
    return { success: true, data: mockLeads };
  }

  if (url.startsWith('/admin/leads/') && url.endsWith('/status')) {
    const id = url.split('/')[3];
    const lead = mockLeads.find((l) => l.id === id);
    if (lead && body?.status) {
      lead.status = body.status;
      return { success: true, data: lead };
    }
  }

  // BILLING
  if (url === '/admin/billing') {
    const billingData = mockOrganizers.map((org) => ({
      id: org.id,
      name: org.name,
      email: org.email,
      plan: org.plan,
      segment: org.segment || 'event_builder',
      status: org.status === 'suspended' ? 'expired' : 'active',
      planStartedAt: org.createdAt,
      planExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    }));
    return { success: true, data: billingData };
  }

  // AUDIT LOGS
  if (url === '/admin/audit-log') {
    return { success: true, data: mockAuditLogs };
  }

  throw new ApiError('Not found', 'NOT_FOUND', 404);
}

// ==========================================

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Check if this is an admin path. If so, intercept with mock data
  if (path.startsWith('/admin')) {
    let bodyObj = null;
    if (options.body) {
      try {
        bodyObj = JSON.parse(options.body as string);
      } catch (e) {}
    }
    const mockRes = handleMockRequest(options.method || 'GET', path, bodyObj);
    return mockRes.data as T;
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  });

  let payload: ApiResponse<T>;
  try {
    payload = await response.json();
  } catch (err) {
    throw new ApiError(
      `Failed to parse response: ${response.statusText}`,
      'PARSE_ERROR',
      response.status
    );
  }

  if (!response.ok || !payload.success) {
    const errorDetails = payload.error || {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
    };
    throw new ApiError(errorDetails.message, errorDetails.code, response.status);
  }

  return payload.data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
