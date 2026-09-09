'use client';

import React from 'react';
import { useOrganizerRole } from '@/hooks/use-organizer-role';

interface PermissionGateProps {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ resource, children, fallback = null }: PermissionGateProps) {
  const { can, isLoading } = useOrganizerRole();

  if (isLoading) {
    return null;
  }

  if (!can(resource)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
