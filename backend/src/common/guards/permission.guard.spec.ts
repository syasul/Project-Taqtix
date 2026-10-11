import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionGuard } from './permission.guard';

describe('PRIORITAS 2.1 — Permission Matrix (Team Access RBAC)', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let prisma: any;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      event: {
        findUnique: jest.fn().mockResolvedValue({ id: 'event-1', organizerId: 'org-1' }),
      },
      organizerMember: {
        findFirst: jest.fn(),
      },
    };
    guard = new PermissionGuard(reflector, prisma);
  });

  const createMockContext = (
    userRole: string,
    params: Record<string, string> = { organizerId: 'org-1' },
    body: any = {},
  ) => {
    const req = {
      user: { id: 'user-member-1', role: 'organizer' },
      params,
      body,
    };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;
  };

  const testMatrixCases = [
    {
      role: 'finance',
      permission: 'create_edit_event',
      endpoint: 'POST /organizer/events',
      expectedStatus: 403,
      shouldAllow: false,
    },
    {
      role: 'marketing',
      permission: 'manage_payment_settings',
      endpoint: 'PATCH /organizer/settings/payment',
      expectedStatus: 403,
      shouldAllow: false,
    },
    {
      role: 'viewer',
      permission: 'manage_promo_code',
      endpoint: 'POST /organizer/vouchers',
      expectedStatus: 403,
      shouldAllow: false,
    },
    {
      role: 'admin',
      permission: 'manage_team_access',
      endpoint: 'DELETE /organizer/team/:id',
      expectedStatus: 403,
      shouldAllow: false, // Hanya owner yang boleh manage_team_access
    },
    {
      role: 'owner',
      permission: 'manage_team_access',
      endpoint: 'DELETE /organizer/team/:id',
      expectedStatus: 200,
      shouldAllow: true,
    },
    {
      role: 'finance',
      permission: 'view_sales_revenue',
      endpoint: 'GET /organizer/dashboard/revenue',
      expectedStatus: 200,
      shouldAllow: true,
    },
    {
      role: 'marketing',
      permission: 'manage_partners_affiliate',
      endpoint: 'POST /organizer/affiliates',
      expectedStatus: 200,
      shouldAllow: true,
    },
  ];

  testMatrixCases.forEach(({ role, permission, endpoint, shouldAllow }) => {
    it(`Role "${role}" akses ke "${permission}" (${endpoint}) -> ${shouldAllow ? 'DIIZINKAN' : 'DITOLAK 403'}`, async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permission);

      prisma.organizerMember.findFirst.mockResolvedValue({
        id: 'mem-1',
        organizerId: 'org-1',
        userId: 'user-member-1',
        role,
        status: 'active',
      });

      const context = createMockContext(role);

      if (shouldAllow) {
        const canActivate = await guard.canActivate(context);
        expect(canActivate).toBe(true);
      } else {
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }
    });
  });

  it('Superadmin platform (role: admin) selalu memiliki akses ke semua endpoint', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('manage_team_access');

    const adminContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'super-admin-1', role: 'admin' },
          params: { organizerId: 'org-1' },
          body: {},
        }),
      }),
    } as unknown as ExecutionContext;

    const canActivate = await guard.canActivate(adminContext);
    expect(canActivate).toBe(true);
  });
});
