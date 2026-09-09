'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { apiClient } from '@/lib/api-client';

export type OrganizerRole = 'owner' | 'admin' | 'finance' | 'marketing' | 'viewer' | 'cashier';

export const PERMISSION_MATRIX: Record<string, OrganizerRole[]> = {
  create_edit_event: ['owner', 'admin'],
  publish_unpublish_event: ['owner', 'admin'],
  manage_ticket_category: ['owner', 'admin'],
  view_sales_revenue: ['owner', 'admin', 'finance', 'marketing', 'viewer'],
  manage_payment_settings: ['owner', 'finance'],
  view_manage_settlement: ['owner', 'finance'],
  manage_partners_affiliate: ['owner', 'admin', 'marketing'],
  manage_promo_code: ['owner', 'admin', 'marketing'],
  view_analytics_growth: ['owner', 'admin', 'finance', 'marketing', 'viewer'],
  manage_workforce_crew: ['owner', 'admin'],
  manage_audience_segments: ['owner', 'admin', 'marketing'],
  manage_team_access: ['owner'],
  edit_organization_settings: ['owner'],
  pos_cashier: ['owner', 'admin', 'finance', 'cashier'],
};

export function useOrganizerRole() {
  const { user, accessToken } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['auth-me', user?.id],
    queryFn: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data?.data || res.data;
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });

  // Role organisasi: dari /auth/me profile.organizerRole atau fallback ke 'owner' jika user role adalah 'organizer'
  const role: OrganizerRole = (profile?.organizerRole ||
    (user?.role === 'organizer' ? 'owner' : 'viewer')) as OrganizerRole;

  const isOwner = role === 'owner';

  const can = (resource: string): boolean => {
    const allowedRoles = PERMISSION_MATRIX[resource];
    if (!allowedRoles) return true; // jika resource tidak terdaftar, izinkan akses default
    return allowedRoles.includes(role);
  };

  return {
    role,
    isOwner,
    can,
    isLoading,
    organizer: profile?.organizer || null,
  };
}
