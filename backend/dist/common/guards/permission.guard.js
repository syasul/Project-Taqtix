"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../modules/prisma/prisma.service");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const PERMISSION_MATRIX = {
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
let PermissionGuard = class PermissionGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredPermission = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermission) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException('Pengguna tidak terotentikasi');
        }
        if (user.role === 'admin') {
            return true;
        }
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
        let role = null;
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
        if (!role && user.role === 'organizer') {
            role = 'owner';
        }
        if (!role) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan bagian dari organizer ini');
        }
        const allowedRoles = PERMISSION_MATRIX[requiredPermission];
        if (!allowedRoles || !allowedRoles.includes(role)) {
            throw new common_1.ForbiddenException(`Akses ditolak: Dibutuhkan izin ${requiredPermission} (Peran Anda: ${role})`);
        }
        request.activeOrganizerId = organizerId;
        request.activeOrganizerRole = role;
        return true;
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PermissionGuard);
//# sourceMappingURL=permission.guard.js.map