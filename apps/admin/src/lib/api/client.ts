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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/v1';

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
  { id: 'org-1', name: 'Taqwa Media Group', email: 'contact@taqwamedia.id', phone: '08123456789', status: 'active', plan: 'pro', createdAt: '2026-08-01T10:00:00Z', approvedAt: '2026-08-01T12:00:00Z', approvedBy: 'admin@taqtix.id', eventCount: 4 },
  { id: 'org-2', name: 'Nusantara Hijrah Fest', email: 'info@hijrahfest.id', phone: '08987654321', status: 'pending', plan: 'starter', createdAt: '2026-08-20T14:30:00Z', approvedAt: null, approvedBy: null, eventCount: 0 },
  { id: 'org-3', name: 'Dunia Halal Expo', email: 'hello@duniahalal.com', phone: '08112233445', status: 'active', plan: 'enterprise', createdAt: '2026-07-15T09:00:00Z', approvedAt: '2026-07-15T11:00:00Z', approvedBy: 'admin@taqtix.id', eventCount: 2 },
  { id: 'org-4', name: 'Amal Bersama Foundation', email: 'charity@amalbersama.org', phone: '08556677889', status: 'suspended', plan: 'starter', createdAt: '2026-05-10T08:00:00Z', approvedAt: '2026-05-10T10:00:00Z', approvedBy: 'admin@taqtix.id', eventCount: 1 }
];

let mockEvents = [
  { id: 'evt-1', title: 'Taqwa Movement Concert 2026', slug: 'taqwa-movement-2026', organizerName: 'Taqwa Media Group', location: 'Jakarta Convention Center', status: 'published', startDate: '2026-09-12T13:00:00Z', endDate: '2026-09-12T22:00:00Z', ticketsSold: 450, quota: 650 },
  { id: 'evt-2', title: 'Kajian Akbar: Menjemput Hidayah', slug: 'kajian-akbar-digital-hidayah', organizerName: 'Taqwa Media Group', location: 'Masjid Istiqlal, Jakarta', status: 'published', startDate: '2026-10-04T08:00:00Z', endDate: '2026-10-04T12:00:00Z', ticketsSold: 920, quota: 1200 },
  { id: 'evt-3', title: 'Fest Hijrah & Halal Culinary 2026', slug: 'fest-hijrah-halal-culinary-2026', organizerName: 'Nusantara Hijrah Fest', location: 'ICE BSD, Tangerang', status: 'draft', startDate: '2026-11-20T10:00:00Z', endDate: '2026-11-22T22:00:00Z', ticketsSold: 0, quota: 4000 }
];

let mockOrders = [
  { id: 'ord-1029', eventTitle: 'Taqwa Movement Concert 2026', buyerName: 'Muhammad Ilyas', buyerEmail: 'ilyas@example.com', buyerPhone: '081299990000', status: 'paid', totalAmount: 300000, discountAmount: 0, createdAt: '2026-08-22T15:10:00Z', expiredAt: '2026-08-22T15:25:00Z', items: [{ id: 'item-1', name: 'Regular Ticket', qty: 2, price: 150000 }] },
  { id: 'ord-1030', eventTitle: 'Kajian Akbar: Menjemput Hidayah', buyerName: 'Siti Aminah', buyerEmail: 'aminah@outlook.com', buyerPhone: '085711112222', status: 'pending', totalAmount: 75000, discountAmount: 0, createdAt: '2026-08-22T17:05:00Z', expiredAt: '2026-08-22T17:20:00Z', items: [{ id: 'item-2', name: 'Infaq Dakwah - Prioritas', qty: 1, price: 75000 }] },
  { id: 'ord-1031', eventTitle: 'Taqwa Movement Concert 2026', buyerName: 'Budi Santoso', buyerEmail: 'budi@domain.com', buyerPhone: '081388887777', status: 'expired', totalAmount: 150000, discountAmount: 0, createdAt: '2026-08-21T10:00:00Z', expiredAt: '2026-08-21T10:15:00Z', items: [{ id: 'item-3', name: 'Regular Ticket', qty: 1, price: 150000 }] }
];

let mockSettlements = [
  { id: 'set-1', eventTitle: 'Taqwa Movement Concert 2026', organizerName: 'Taqwa Media Group', grossRevenue: 67500000, platformFee: 3375000, affiliateCommissionTotal: 5000000, netAmount: 59125000, status: 'pending', paidAt: null, paidBy: null },
  { id: 'set-2', eventTitle: 'Kajian Akbar: Menjemput Hidayah', organizerName: 'Taqwa Media Group', grossRevenue: 38000000, platformFee: 1900000, affiliateCommissionTotal: 0, netAmount: 36100000, status: 'paid', paidAt: '2026-08-18T16:00:00Z', paidBy: 'admin@taqtix.id' }
];

let mockAuditLogs = [
  { id: 'log-1', adminEmail: 'admin@taqtix.id', action: 'APPROVE_ORGANIZER', target: 'Taqwa Media Group (org-1)', timestamp: '2026-08-01T12:00:00Z' },
  { id: 'log-2', adminEmail: 'admin@taqtix.id', action: 'MARK_SETTLEMENT_PAID', target: 'Kajian Akbar (set-2)', timestamp: '2026-08-18T16:00:00Z' }
];

function handleMockRequest(method: string, path: string, body?: any): ApiResponse {
  const url = path.split('?')[0]; // strip query parameters
  
  if (url === '/admin/dashboard') {
    const activeOrgs = mockOrganizers.filter(o => o.status === 'active').length;
    const publishedEvents = mockEvents.filter(e => e.status === 'published').length;
    const totalRev = mockSettlements.reduce((sum, s) => sum + s.grossRevenue, 0);
    const totalFee = mockSettlements.reduce((sum, s) => sum + s.platformFee, 0);
    const pendingOrgs = mockOrganizers.filter(o => o.status === 'pending').length;
    const pendingSets = mockSettlements.filter(s => s.status === 'pending').length;

    return {
      success: true,
      data: {
        metrics: {
          activeOrganizers: activeOrgs,
          publishedEvents,
          platformRevenue: totalRev,
          feesCollected: totalFee,
          pendingApprovals: pendingOrgs,
          pendingSettlements: pendingSets
        },
        recentSales: [
          { name: 'Minggu 1', sales: 120, revenue: 18000000 },
          { name: 'Minggu 2', sales: 250, revenue: 37500000 },
          { name: 'Minggu 3', sales: 380, revenue: 57000000 },
          { name: 'Minggu 4', sales: 480, revenue: 72000000 }
        ]
      }
    };
  }

  if (url === '/admin/organizers') {
    return { success: true, data: mockOrganizers };
  }

  if (url.startsWith('/admin/organizers/') && url.endsWith('/approve')) {
    const id = url.split('/')[3];
    const org = mockOrganizers.find(o => o.id === id);
    if (org) {
      org.status = 'active';
      org.approvedAt = new Date().toISOString();
      org.approvedBy = 'admin@taqtix.id';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'APPROVE_ORGANIZER',
        target: `${org.name} (${org.id})`,
        timestamp: new Date().toISOString()
      });
      return { success: true, data: org };
    }
  }

  if (url.startsWith('/admin/organizers/') && url.endsWith('/suspend')) {
    const id = url.split('/')[3];
    const org = mockOrganizers.find(o => o.id === id);
    if (org) {
      org.status = 'suspended';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'SUSPEND_ORGANIZER',
        target: `${org.name} (${org.id})`,
        timestamp: new Date().toISOString()
      });
      return { success: true, data: org };
    }
  }

  if (url.startsWith('/admin/organizers/') && url.endsWith('/plan')) {
    const id = url.split('/')[3];
    const org = mockOrganizers.find(o => o.id === id);
    if (org && body?.plan) {
      const oldPlan = org.plan;
      org.plan = body.plan;
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'CHANGE_ORGANIZER_PLAN',
        target: `${org.name} (${org.id}): ${oldPlan} -> ${body.plan}`,
        timestamp: new Date().toISOString()
      });
      return { success: true, data: org };
    }
  }

  if (url === '/admin/events') {
    return { success: true, data: mockEvents };
  }

  if (url.startsWith('/admin/events/') && url.endsWith('/force-unpublish')) {
    const id = url.split('/')[3];
    const event = mockEvents.find(e => e.id === id);
    if (event) {
      event.status = 'draft';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'FORCE_UNPUBLISH_EVENT',
        target: `${event.title} (${event.id})`,
        timestamp: new Date().toISOString()
      });
      return { success: true, data: event };
    }
  }

  if (url === '/admin/orders') {
    return { success: true, data: mockOrders };
  }

  if (url === '/admin/settlements') {
    return { success: true, data: mockSettlements };
  }

  if (url.startsWith('/admin/settlements/') && url.endsWith('/mark-paid')) {
    const id = url.split('/')[3];
    const set = mockSettlements.find(s => s.id === id);
    if (set) {
      set.status = 'paid';
      set.paidAt = new Date().toISOString();
      set.paidBy = 'admin@taqtix.id';
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        adminEmail: 'admin@taqtix.id',
        action: 'MARK_SETTLEMENT_PAID',
        target: `${set.eventTitle} (${set.id})`,
        timestamp: new Date().toISOString()
      });
      return { success: true, data: set };
    }
  }

  if (url === '/admin/audit-log') {
    return { success: true, data: mockAuditLogs };
  }

  throw new ApiError('Not found', 'NOT_FOUND', 404);
}

// ==========================================

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
