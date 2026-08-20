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
exports.GateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
let GateService = class GateService {
    prisma;
    configService;
    jwtService;
    constructor(prisma, configService, jwtService) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtService = jwtService;
    }
    async verifyEventOwnership(eventId, organizerUserId) {
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId: organizerUserId },
        });
        if (!organizer) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan organizer');
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.organizerId !== organizer.id) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pemilik event ini');
        }
        return event;
    }
    async assignStaff(eventId, dto, organizerUserId) {
        await this.verifyEventOwnership(eventId, organizerUserId);
        const staffUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!staffUser) {
            throw new common_1.NotFoundException('Staf dengan email tersebut tidak ditemukan');
        }
        if (staffUser.role === 'user') {
            await this.prisma.user.update({
                where: { id: staffUser.id },
                data: { role: 'gate_staff' },
            });
        }
        const existingStaff = await this.prisma.gateStaff.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: staffUser.id,
                },
            },
        });
        if (existingStaff) {
            return existingStaff;
        }
        return this.prisma.gateStaff.create({
            data: {
                eventId,
                userId: staffUser.id,
                gateName: 'Pintu Utama',
            },
        });
    }
    async getStaffList(eventId, organizerUserId) {
        await this.verifyEventOwnership(eventId, organizerUserId);
        return this.prisma.gateStaff.findMany({
            where: { eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async validateTicket(dto, staffUserId) {
        let decoded;
        try {
            decoded = await this.jwtService.verifyAsync(dto.qrPayload, {
                secret: this.configService.get('TAQTIX_JWT_ACCESS_SECRET'),
            });
        }
        catch (error) {
            throw new common_1.BadRequestException('QR Code tidak valid atau tanda tangan palsu');
        }
        const { ticketId } = decoded;
        return this.prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    ticketType: {
                        include: {
                            event: true,
                        },
                    },
                    order: true,
                },
            });
            if (!ticket) {
                throw new common_1.NotFoundException('Tiket tidak terdaftar di sistem');
            }
            const event = ticket.ticketType.event;
            const isOrganizer = await tx.organizer.findFirst({
                where: { userId: staffUserId, id: event.organizerId },
            });
            if (!isOrganizer) {
                const isAssignedStaff = await tx.gateStaff.findUnique({
                    where: {
                        eventId_userId: {
                            eventId: event.id,
                            userId: staffUserId,
                        },
                    },
                });
                if (!isAssignedStaff) {
                    throw new common_1.ForbiddenException('Akses ditolak: Anda tidak ditugaskan di gerbang event ini');
                }
            }
            if (ticket.status === client_1.TicketStatus.CHECKED_IN) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'DUPLICATE',
                    },
                });
                throw new common_1.BadRequestException('Tiket sudah pernah digunakan / check-in sebelumnya');
            }
            if (ticket.status !== client_1.TicketStatus.ISSUED) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'INVALID',
                    },
                });
                throw new common_1.BadRequestException(`Tiket tidak aktif (Status: ${ticket.status})`);
            }
            await tx.ticket.update({
                where: { id: ticket.id },
                data: {
                    status: client_1.TicketStatus.CHECKED_IN,
                    checkedInAt: new Date(),
                    checkedInBy: staffUserId,
                },
            });
            await tx.scanLog.create({
                data: {
                    ticketId: ticket.id,
                    scannedById: staffUserId,
                    result: 'VALID',
                },
            });
            return {
                success: true,
                message: 'Check-in berhasil! Selamat menikmati acara.',
                ticketId: ticket.id,
                buyerName: ticket.order.buyerName,
                ticketCategory: ticket.ticketType.name,
                eventTitle: event.title,
            };
        });
    }
    async manualCheckin(dto, staffUserId) {
        return this.prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.findFirst({
                where: {
                    OR: [
                        { id: dto.code },
                        { code: dto.code },
                    ],
                },
                include: {
                    ticketType: {
                        include: {
                            event: true,
                        },
                    },
                    order: true,
                },
            });
            if (!ticket) {
                throw new common_1.NotFoundException('Tiket tidak terdaftar di sistem');
            }
            const event = ticket.ticketType.event;
            const isOrganizer = await tx.organizer.findFirst({
                where: { userId: staffUserId, id: event.organizerId },
            });
            if (!isOrganizer) {
                const isAssignedStaff = await tx.gateStaff.findUnique({
                    where: {
                        eventId_userId: {
                            eventId: event.id,
                            userId: staffUserId,
                        },
                    },
                });
                if (!isAssignedStaff) {
                    throw new common_1.ForbiddenException('Akses ditolak: Anda tidak ditugaskan di gerbang event ini');
                }
            }
            if (ticket.status === client_1.TicketStatus.CHECKED_IN) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'DUPLICATE',
                    },
                });
                throw new common_1.BadRequestException('Tiket sudah pernah digunakan / check-in sebelumnya');
            }
            if (ticket.status !== client_1.TicketStatus.ISSUED) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'INVALID',
                    },
                });
                throw new common_1.BadRequestException(`Tiket tidak aktif (Status: ${ticket.status})`);
            }
            await tx.ticket.update({
                where: { id: ticket.id },
                data: {
                    status: client_1.TicketStatus.CHECKED_IN,
                    checkedInAt: new Date(),
                    checkedInBy: staffUserId,
                },
            });
            await tx.scanLog.create({
                data: {
                    ticketId: ticket.id,
                    scannedById: staffUserId,
                    result: 'VALID',
                },
            });
            return {
                success: true,
                message: 'Check-in manual berhasil!',
                ticketId: ticket.id,
                buyerName: ticket.order.buyerName,
                ticketCategory: ticket.ticketType.name,
                eventTitle: event.title,
            };
        });
    }
    async syncBatch(dto, staffUserId) {
        let successCount = 0;
        for (const log of dto.logs) {
            try {
                const decoded = await this.jwtService.verifyAsync(log.qrPayload, {
                    secret: this.configService.get('TAQTIX_JWT_ACCESS_SECRET'),
                });
                const { ticketId } = decoded;
                await this.prisma.$transaction(async (tx) => {
                    const ticket = await tx.ticket.findUnique({
                        where: { id: ticketId },
                        include: {
                            ticketType: {
                                include: {
                                    event: true,
                                },
                            },
                        },
                    });
                    if (!ticket)
                        return;
                    const isOrganizer = await tx.organizer.findFirst({
                        where: { userId: staffUserId, id: ticket.ticketType.event.organizerId },
                    });
                    if (!isOrganizer) {
                        const isAssignedStaff = await tx.gateStaff.findUnique({
                            where: {
                                eventId_userId: {
                                    eventId: ticket.ticketType.eventId,
                                    userId: staffUserId,
                                },
                            },
                        });
                        if (!isAssignedStaff)
                            return;
                    }
                    if (ticket.status === client_1.TicketStatus.CHECKED_IN) {
                        await tx.scanLog.create({
                            data: {
                                ticketId: ticket.id,
                                scannedById: staffUserId,
                                result: 'DUPLICATE',
                                scannedAt: new Date(log.scannedAt),
                                synced: false,
                            },
                        });
                        return;
                    }
                    if (ticket.status === client_1.TicketStatus.ISSUED) {
                        await tx.ticket.update({
                            where: { id: ticket.id },
                            data: {
                                status: client_1.TicketStatus.CHECKED_IN,
                                checkedInAt: new Date(log.scannedAt),
                                checkedInBy: staffUserId,
                            },
                        });
                        await tx.scanLog.create({
                            data: {
                                ticketId: ticket.id,
                                scannedById: staffUserId,
                                result: 'VALID',
                                scannedAt: new Date(log.scannedAt),
                                synced: false,
                            },
                        });
                        successCount++;
                    }
                });
            }
            catch (error) {
                console.warn(`[Sync Batch] Gagal memproses sinkronisasi satu baris log:`, error);
            }
        }
        return {
            success: true,
            message: 'Sinkronisasi batch scan selesai',
            syncedCount: successCount,
        };
    }
    async getAttendance(eventId, organizerUserId) {
        const event = await this.verifyEventOwnership(eventId, organizerUserId);
        const ticketTypes = await this.prisma.ticketType.findMany({
            where: { eventId },
            include: {
                tickets: {
                    select: { status: true },
                },
            },
        });
        let totalTicketsIssued = 0;
        let totalTicketsCheckedIn = 0;
        const breakdown = ticketTypes.map((tt) => {
            const issued = tt.tickets.length;
            const checkedIn = tt.tickets.filter((t) => t.status === client_1.TicketStatus.CHECKED_IN).length;
            totalTicketsIssued += issued;
            totalTicketsCheckedIn += checkedIn;
            return {
                ticketCategoryId: tt.id,
                ticketCategoryName: tt.name,
                issuedCount: issued,
                checkedInCount: checkedIn,
                attendanceRate: issued > 0 ? parseFloat(((checkedIn / issued) * 100).toFixed(2)) : 0.0,
            };
        });
        const attendanceRate = totalTicketsIssued > 0
            ? parseFloat(((totalTicketsCheckedIn / totalTicketsIssued) * 100).toFixed(2))
            : 0.0;
        return {
            eventId: event.id,
            eventTitle: event.title,
            totalTicketsIssued,
            totalTicketsCheckedIn,
            attendanceRate,
            breakdown,
        };
    }
};
exports.GateService = GateService;
exports.GateService = GateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService])
], GateService);
//# sourceMappingURL=gate.service.js.map