import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

const PERMISSION_MATRIX: Record<string, string[]> = {
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
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission is required, pass through
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak terotentikasi');
    }

    // Main platform admin has access to everything
    if (user.role === 'admin') {
      return true;
    }

    // Resolve organizerId or eventId from route params or body
    let organizerId = request.params.organizerId || request.body.organizerId;
    const eventId = request.params.eventId || request.params.id || request.body.eventId;

    if (!organizerId && eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });
      if (event) {
        organizerId = event.organizerId;
      }
    }

    // Find the member mapping
    let role: string | null = null;

    if (organizerId) {
      const member = await this.prisma.organizerMember.findFirst({
        where: {
          organizerId,
          userId: user.id,
          status: 'active',
        },
      });
      if (member) {
        role = member.role;
      }
    }

    // Fallback: If no role resolved yet, check if the user belongs to any active organizer as a member
    if (!role) {
      const member = await this.prisma.organizerMember.findFirst({
        where: {
          userId: user.id,
          status: 'active',
        },
      });
      if (member) {
        role = member.role;
      }
    }

    // Fallback: If legacy single-user organizer role matches, treat as owner
    if (!role && user.role === 'organizer') {
      role = 'owner';
    }

    if (!role) {
      throw new ForbiddenException('Akses ditolak: Anda bukan bagian dari organizer ini');
    }

    const allowedRoles = PERMISSION_MATRIX[requiredPermission];
    if (!allowedRoles || !allowedRoles.includes(role)) {
      throw new ForbiddenException(
        `Akses ditolak: Dibutuhkan izin ${requiredPermission} (Peran Anda: ${role})`,
      );
    }

    // Inject active organizerId and role into request context for controller reuse
    request.activeOrganizerId = organizerId;
    request.activeOrganizerRole = role;

    return true;
  }
}
