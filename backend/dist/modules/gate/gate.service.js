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
            const qrSecret = this.configService.get('QR_SIGNING_SECRET') ||
                this.configService.get('QR_SECRET') ||
                'super-secret-qr-key-change-me';
            decoded = await this.jwtService.verifyAsync(dto.qrPayload, {
                secret: qrSecret,
            });
        }
        catch (error) {
            throw new common_1.HttpException({
                code: 'QR_INVALID',
                message: 'QR Code tidak valid, tanda tangan palsu, atau kedaluwarsa',
            }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
        }
        const { ticketId } = decoded;
        return this.prisma.$transaction(async (tx) => {
            if (typeof tx.$queryRaw === 'function') {
                try {
                    await tx.$queryRaw `
            SELECT id FROM "Ticket"
            WHERE id = ${ticketId}
            FOR UPDATE
          `;
                }
                catch (lockError) {
                }
            }
            const ticket = await tx.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    orderItem: {
                        include: {
                            ticketCategory: true,
                            order: true,
                        },
                    },
                },
            });
            if (!ticket) {
                throw new common_1.NotFoundException('Tiket tidak terdaftar di sistem');
            }
            if (ticket.isBlocked) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'BLOCKED',
                    },
                });
                throw new common_1.HttpException({
                    code: 'TICKET_BLOCKED',
                    message: ticket.blockedReason ||
                        'Tiket telah dinonaktifkan / diblokir oleh panitia',
                }, common_1.HttpStatus.FORBIDDEN);
            }
            const isOrganizer = await tx.organizer.findFirst({
                where: {
                    userId: staffUserId,
                    id: ticket.orderItem.ticketCategory.eventId,
                },
            });
            if (!isOrganizer) {
                const isAssignedStaff = await tx.gateStaff.findUnique({
                    where: {
                        eventId_userId: {
                            eventId: ticket.eventId,
                            userId: staffUserId,
                        },
                    },
                });
                if (!isAssignedStaff) {
                    throw new common_1.ForbiddenException('Akses ditolak: Anda tidak ditugaskan di gerbang event ini');
                }
            }
            const isOut = dto.action === 'out';
            if (isOut) {
                if (ticket.status !== client_1.TicketStatus.CHECKED_IN) {
                    await tx.scanLog.create({
                        data: {
                            ticketId: ticket.id,
                            scannedById: staffUserId,
                            result: 'INVALID_OUT',
                        },
                    });
                    throw new common_1.HttpException({
                        code: 'TICKET_NOT_INSIDE',
                        message: 'Tiket belum check-in masuk (tidak bisa check-out)',
                    }, common_1.HttpStatus.BAD_REQUEST);
                }
                const updatedTicket = await tx.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        status: client_1.TicketStatus.VALID,
                        checkedOutAt: new Date(),
                        checkedOutBy: staffUserId,
                    },
                });
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'CHECK_OUT',
                    },
                });
                return {
                    success: true,
                    message: 'Check-out berhasil! Tiket dinonaktifkan sementara (bisa masuk kembali).',
                    ticketId: ticket.id,
                    buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
                    ticketCategory: ticket.orderItem.ticketCategory.name,
                    eventTitle: ticket.orderItem.ticketCategory.name,
                    ticket: {
                        id: ticket.id,
                        status: updatedTicket.status,
                        checkedInAt: updatedTicket.checkedInAt,
                        checkedOutAt: updatedTicket.checkedOutAt,
                        orderItem: {
                            attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
                            ticketCategory: {
                                name: ticket.orderItem.ticketCategory.name,
                            },
                        },
                    },
                };
            }
            if (ticket.status === client_1.TicketStatus.TRANSFER_PENDING) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'TRANSFER_PENDING',
                    },
                });
                throw new common_1.HttpException({
                    code: 'QR_INVALID',
                    message: 'Tiket sedang dalam proses transfer kepemilikan. QR lama ini tidak dapat digunakan untuk check-in.',
                }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
            }
            if (ticket.status !== client_1.TicketStatus.VALID && ticket.status !== client_1.TicketStatus.CHECKED_IN) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'INVALID',
                    },
                });
                throw new common_1.HttpException({
                    code: 'QR_INVALID',
                    message: `Tiket tidak aktif (Status: ${ticket.status})`,
                }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
            }
            const category = ticket.orderItem.ticketCategory;
            const ticketPerPackage = Number(category?.ticketPerPackage) || 1;
            const isCategoryCouple = ticketPerPackage === 2 ||
                /couple|pasangan|berdua|duet|paket\s*2/i.test(category?.name || '');
            const siblingTickets = await tx.ticket.findMany({
                where: { orderItemId: ticket.orderItemId },
                select: { id: true, attendeeName: true },
            });
            const hasSeparateBarcodes = siblingTickets.length > 1;
            const validScanCount = await tx.scanLog.count({
                where: {
                    ticketId: ticket.id,
                    result: 'VALID',
                },
            });
            if (hasSeparateBarcodes) {
                if (ticket.status === client_1.TicketStatus.CHECKED_IN || validScanCount >= 1) {
                    await tx.scanLog.create({
                        data: {
                            ticketId: ticket.id,
                            scannedById: staffUserId,
                            result: 'DUPLICATE',
                        },
                    });
                    const msg = isCategoryCouple
                        ? `Tiket untuk ${ticket.attendeeName || 'peserta ini'} sudah pernah check-in sebelumnya. Pasangan Anda wajib menggunakan barcode kedua miliknya sendiri.`
                        : 'Tiket perorangan ini sudah pernah digunakan untuk check-in sebelumnya (1 tiket untuk 1 orang).';
                    throw new common_1.HttpException({
                        code: 'QR_ALREADY_USED',
                        message: msg,
                    }, common_1.HttpStatus.CONFLICT);
                }
                const updatedTicket = await tx.ticket.update({
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
                    message: isCategoryCouple
                        ? 'Check-in berhasil! Tiket Berpasangan (Barcode Mandiri Peserta).'
                        : 'Check-in berhasil! Selamat menikmati acara (Tiket Perorangan: 1 orang).',
                    ticketId: ticket.id,
                    buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
                    ticketCategory: ticket.orderItem.ticketCategory.name,
                    eventTitle: ticket.orderItem.ticketCategory.name,
                    isCouple: isCategoryCouple,
                    ticket: {
                        id: ticket.id,
                        status: updatedTicket.status,
                        checkedInAt: updatedTicket.checkedInAt,
                        checkedOutAt: updatedTicket.checkedOutAt,
                        orderItem: {
                            attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
                            ticketCategory: {
                                name: ticket.orderItem.ticketCategory.name,
                            },
                        },
                    },
                };
            }
            if (isCategoryCouple) {
                const maxAllowedPax = ticketPerPackage > 1 ? ticketPerPackage : 2;
                if (validScanCount >= maxAllowedPax || ticket.status === client_1.TicketStatus.CHECKED_IN) {
                    await tx.scanLog.create({
                        data: {
                            ticketId: ticket.id,
                            scannedById: staffUserId,
                            result: 'DUPLICATE',
                        },
                    });
                    throw new common_1.HttpException({
                        code: 'QR_ALREADY_USED',
                        message: `Tiket berpasangan ini sudah memenuhi kuota maksimal (${maxAllowedPax} dari ${maxAllowedPax} orang sudah check-in).`,
                    }, common_1.HttpStatus.CONFLICT);
                }
                const isLastPax = validScanCount + 1 >= maxAllowedPax;
                const updatedTicket = await tx.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        status: isLastPax ? client_1.TicketStatus.CHECKED_IN : client_1.TicketStatus.VALID,
                        checkedInAt: ticket.checkedInAt || new Date(),
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
                const successMsg = isLastPax
                    ? `Check-in berhasil! Tiket Berpasangan lengkap (${validScanCount + 1} dari ${maxAllowedPax} orang telah masuk).`
                    : `Check-in berhasil! Tiket Berpasangan (${validScanCount + 1} dari ${maxAllowedPax} orang telah masuk). Barcode masih dapat digunakan untuk 1 orang pasangannya.`;
                return {
                    success: true,
                    message: successMsg,
                    ticketId: ticket.id,
                    buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
                    ticketCategory: ticket.orderItem.ticketCategory.name,
                    eventTitle: ticket.orderItem.ticketCategory.name,
                    isCouple: true,
                    remainingPax: maxAllowedPax - (validScanCount + 1),
                    ticket: {
                        id: ticket.id,
                        status: updatedTicket.status,
                        checkedInAt: updatedTicket.checkedInAt,
                        checkedOutAt: updatedTicket.checkedOutAt,
                        orderItem: {
                            attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
                            ticketCategory: {
                                name: ticket.orderItem.ticketCategory.name,
                            },
                        },
                    },
                };
            }
            if (ticket.status === client_1.TicketStatus.CHECKED_IN || validScanCount >= 1) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'DUPLICATE',
                    },
                });
                throw new common_1.HttpException({
                    code: 'QR_ALREADY_USED',
                    message: 'Tiket perorangan ini sudah pernah digunakan untuk check-in sebelumnya (1 tiket hanya berlaku untuk 1 orang).',
                }, common_1.HttpStatus.CONFLICT);
            }
            const updatedTicket = await tx.ticket.update({
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
                message: 'Check-in berhasil! Selamat menikmati acara (Tiket Perorangan: 1 orang).',
                ticketId: ticket.id,
                buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
                ticketCategory: ticket.orderItem.ticketCategory.name,
                eventTitle: ticket.orderItem.ticketCategory.name,
                isCouple: false,
                ticket: {
                    id: ticket.id,
                    status: updatedTicket.status,
                    checkedInAt: updatedTicket.checkedInAt,
                    checkedOutAt: updatedTicket.checkedOutAt,
                    orderItem: {
                        attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
                        ticketCategory: {
                            name: ticket.orderItem.ticketCategory.name,
                        },
                    },
                },
            };
        });
    }
    async manualCheckin(dto, staffUserId) {
        return this.prisma.$transaction(async (tx) => {
            const preliminary = await tx.ticket.findFirst({
                where: {
                    OR: [{ id: dto.code }, { qrPayload: dto.code }],
                },
                select: { id: true },
            });
            if (!preliminary) {
                throw new common_1.NotFoundException('Tiket tidak terdaftar di sistem');
            }
            if (typeof tx.$queryRaw === 'function') {
                try {
                    await tx.$queryRaw `
            SELECT id FROM "Ticket"
            WHERE id = ${preliminary.id}
            FOR UPDATE
          `;
                }
                catch (lockErr) {
                }
            }
            const ticket = await tx.ticket.findUnique({
                where: { id: preliminary.id },
                include: {
                    orderItem: {
                        include: {
                            ticketCategory: true,
                            order: true,
                        },
                    },
                },
            });
            if (!ticket) {
                throw new common_1.NotFoundException('Tiket tidak terdaftar di sistem');
            }
            if (ticket.isBlocked) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'BLOCKED',
                    },
                });
                throw new common_1.HttpException({
                    code: 'TICKET_BLOCKED',
                    message: ticket.blockedReason ||
                        'Tiket telah dinonaktifkan / diblokir oleh panitia',
                }, common_1.HttpStatus.FORBIDDEN);
            }
            const isOrganizer = await tx.organizer.findFirst({
                where: {
                    userId: staffUserId,
                    id: ticket.orderItem.ticketCategory.eventId,
                },
            });
            if (!isOrganizer) {
                const isAssignedStaff = await tx.gateStaff.findUnique({
                    where: {
                        eventId_userId: {
                            eventId: ticket.eventId,
                            userId: staffUserId,
                        },
                    },
                });
                if (!isAssignedStaff) {
                    throw new common_1.ForbiddenException('Akses ditolak: Anda tidak ditugaskan di gerbang event ini');
                }
            }
            const isOut = dto.action === 'out';
            if (isOut) {
                if (ticket.status !== client_1.TicketStatus.CHECKED_IN) {
                    await tx.scanLog.create({
                        data: {
                            ticketId: ticket.id,
                            scannedById: staffUserId,
                            result: 'INVALID_OUT',
                        },
                    });
                    throw new common_1.BadRequestException('Tiket belum check-in masuk (tidak bisa check-out)');
                }
                const updatedTicket = await tx.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        status: client_1.TicketStatus.VALID,
                        checkedOutAt: new Date(),
                        checkedOutBy: staffUserId,
                    },
                });
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'CHECK_OUT',
                    },
                });
                return {
                    success: true,
                    message: 'Check-out manual berhasil!',
                    ticketId: ticket.id,
                    buyerName: ticket.orderItem.attendeeName,
                    ticketCategory: ticket.orderItem.ticketCategory.name,
                    eventTitle: ticket.orderItem.ticketCategory.name,
                    ticket: {
                        id: ticket.id,
                        status: updatedTicket.status,
                        checkedInAt: updatedTicket.checkedInAt,
                        checkedOutAt: updatedTicket.checkedOutAt,
                        orderItem: {
                            attendeeName: ticket.orderItem.attendeeName,
                            ticketCategory: {
                                name: ticket.orderItem.ticketCategory.name,
                            },
                        },
                    },
                };
            }
            if (ticket.status !== client_1.TicketStatus.VALID && ticket.status !== client_1.TicketStatus.CHECKED_IN) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'INVALID',
                    },
                });
                throw new common_1.BadRequestException(`Tiket tidak aktif (Status: ${ticket.status})`);
            }
            const category = ticket.orderItem.ticketCategory;
            const ticketPerPackage = Number(category?.ticketPerPackage) || 1;
            const isCategoryCouple = ticketPerPackage === 2 ||
                /couple|pasangan|berdua|duet|paket\s*2/i.test(category?.name || '');
            const siblingTickets = await tx.ticket.findMany({
                where: { orderItemId: ticket.orderItemId },
                select: { id: true, attendeeName: true },
            });
            const hasSeparateBarcodes = siblingTickets.length > 1;
            const validScanCount = await tx.scanLog.count({
                where: {
                    ticketId: ticket.id,
                    result: 'VALID',
                },
            });
            if (hasSeparateBarcodes) {
                if (ticket.status === client_1.TicketStatus.CHECKED_IN || validScanCount >= 1) {
                    await tx.scanLog.create({
                        data: {
                            ticketId: ticket.id,
                            scannedById: staffUserId,
                            result: 'DUPLICATE',
                        },
                    });
                    const msg = isCategoryCouple
                        ? `Tiket manual untuk ${ticket.attendeeName || 'peserta ini'} sudah pernah check-in. Pasangan Anda wajib menggunakan kode/barcode miliknya sendiri.`
                        : 'Tiket perorangan ini sudah pernah digunakan untuk check-in sebelumnya (1 tiket untuk 1 orang).';
                    throw new common_1.BadRequestException(msg);
                }
                const updatedTicket = await tx.ticket.update({
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
                    message: isCategoryCouple
                        ? 'Check-in manual berhasil! Tiket Berpasangan (Kode Peserta).'
                        : 'Check-in manual berhasil! (Tiket Perorangan: 1 orang).',
                    ticketId: ticket.id,
                    buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
                    ticketCategory: ticket.orderItem.ticketCategory.name,
                    eventTitle: ticket.orderItem.ticketCategory.name,
                    isCouple: isCategoryCouple,
                    ticket: {
                        id: ticket.id,
                        status: updatedTicket.status,
                        checkedInAt: updatedTicket.checkedInAt,
                        checkedOutAt: updatedTicket.checkedOutAt,
                        orderItem: {
                            attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
                            ticketCategory: {
                                name: ticket.orderItem.ticketCategory.name,
                            },
                        },
                    },
                };
            }
            if (isCategoryCouple) {
                const maxAllowedPax = ticketPerPackage > 1 ? ticketPerPackage : 2;
                if (validScanCount >= maxAllowedPax || ticket.status === client_1.TicketStatus.CHECKED_IN) {
                    await tx.scanLog.create({
                        data: {
                            ticketId: ticket.id,
                            scannedById: staffUserId,
                            result: 'DUPLICATE',
                        },
                    });
                    throw new common_1.BadRequestException(`Tiket berpasangan ini sudah memenuhi kuota maksimal (${maxAllowedPax} dari ${maxAllowedPax} orang sudah check-in).`);
                }
                const isLastPax = validScanCount + 1 >= maxAllowedPax;
                const updatedTicket = await tx.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        status: isLastPax ? client_1.TicketStatus.CHECKED_IN : client_1.TicketStatus.VALID,
                        checkedInAt: ticket.checkedInAt || new Date(),
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
                const successMsg = isLastPax
                    ? `Check-in manual berhasil! Tiket Berpasangan lengkap (${validScanCount + 1} dari ${maxAllowedPax} orang telah masuk).`
                    : `Check-in manual berhasil! Tiket Berpasangan (${validScanCount + 1} dari ${maxAllowedPax} orang telah masuk). Kode masih berlaku untuk 1 orang pasangannya.`;
                return {
                    success: true,
                    message: successMsg,
                    ticketId: ticket.id,
                    buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
                    ticketCategory: ticket.orderItem.ticketCategory.name,
                    eventTitle: ticket.orderItem.ticketCategory.name,
                    isCouple: true,
                    remainingPax: maxAllowedPax - (validScanCount + 1),
                    ticket: {
                        id: ticket.id,
                        status: updatedTicket.status,
                        checkedInAt: updatedTicket.checkedInAt,
                        checkedOutAt: updatedTicket.checkedOutAt,
                        orderItem: {
                            attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
                            ticketCategory: {
                                name: ticket.orderItem.ticketCategory.name,
                            },
                        },
                    },
                };
            }
            if (ticket.status === client_1.TicketStatus.CHECKED_IN || validScanCount >= 1) {
                await tx.scanLog.create({
                    data: {
                        ticketId: ticket.id,
                        scannedById: staffUserId,
                        result: 'DUPLICATE',
                    },
                });
                throw new common_1.BadRequestException('Tiket perorangan ini sudah pernah digunakan untuk check-in sebelumnya (1 tiket hanya berlaku untuk 1 orang).');
            }
            const updatedTicket = await tx.ticket.update({
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
                message: 'Check-in manual berhasil! (Tiket Perorangan: 1 orang).',
                ticketId: ticket.id,
                buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
                ticketCategory: ticket.orderItem.ticketCategory.name,
                eventTitle: ticket.orderItem.ticketCategory.name,
                isCouple: false,
                ticket: {
                    id: ticket.id,
                    status: updatedTicket.status,
                    checkedInAt: updatedTicket.checkedInAt,
                    checkedOutAt: updatedTicket.checkedOutAt,
                    orderItem: {
                        attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
                        ticketCategory: {
                            name: ticket.orderItem.ticketCategory.name,
                        },
                    },
                },
            };
        });
    }
    async syncBatch(dto, staffUserId) {
        let successCount = 0;
        for (const log of dto.logs) {
            try {
                const qrSecret = this.configService.get('QR_SIGNING_SECRET') ||
                    this.configService.get('QR_SECRET') ||
                    'super-secret-qr-key-change-me';
                const decoded = await this.jwtService.verifyAsync(log.qrPayload, {
                    secret: qrSecret,
                });
                const { ticketId } = decoded;
                await this.prisma.$transaction(async (tx) => {
                    const ticket = await tx.ticket.findUnique({
                        where: { id: ticketId },
                        include: {
                            orderItem: {
                                include: {
                                    ticketCategory: true,
                                },
                            },
                        },
                    });
                    if (!ticket)
                        return;
                    const isOrganizer = await tx.organizer.findFirst({
                        where: {
                            userId: staffUserId,
                            id: ticket.orderItem.ticketCategory.eventId,
                        },
                    });
                    if (!isOrganizer) {
                        const isAssignedStaff = await tx.gateStaff.findUnique({
                            where: {
                                eventId_userId: {
                                    eventId: ticket.eventId,
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
                    if (ticket.status === client_1.TicketStatus.VALID) {
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
        const tickets = await this.prisma.ticket.findMany({
            where: { eventId },
            include: {
                orderItem: {
                    include: {
                        ticketCategory: true,
                    },
                },
            },
        });
        const ticketCategories = await this.prisma.ticketCategory.findMany({
            where: { eventId },
        });
        const totalTicketsIssued = tickets.length;
        const totalTicketsCheckedIn = tickets.filter((t) => t.status === client_1.TicketStatus.CHECKED_IN).length;
        const breakdown = ticketCategories.map((tc) => {
            const categoryTickets = tickets.filter((t) => t.orderItem.ticketCategoryId === tc.id);
            const issued = categoryTickets.length;
            const checkedIn = categoryTickets.filter((t) => t.status === client_1.TicketStatus.CHECKED_IN).length;
            return {
                ticketCategoryId: tc.id,
                ticketCategoryName: tc.name,
                issuedCount: issued,
                checkedInCount: checkedIn,
                attendanceRate: issued > 0
                    ? parseFloat(((checkedIn / issued) * 100).toFixed(2))
                    : 0.0,
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
    async getManifest(eventId, staffUserId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        const isOrganizer = await this.prisma.organizer.findFirst({
            where: { userId: staffUserId, id: event.organizerId },
        });
        if (!isOrganizer) {
            const isAssignedStaff = await this.prisma.gateStaff.findUnique({
                where: {
                    eventId_userId: {
                        eventId,
                        userId: staffUserId,
                    },
                },
            });
            if (!isAssignedStaff) {
                throw new common_1.ForbiddenException('Akses ditolak: Anda tidak ditugaskan di gerbang event ini');
            }
        }
        const tickets = await this.prisma.ticket.findMany({
            where: {
                eventId,
                status: client_1.TicketStatus.VALID,
            },
            include: {
                orderItem: {
                    include: {
                        ticketCategory: true,
                    },
                },
            },
        });
        return tickets.map((t) => ({
            ticketId: t.id,
            qrPayload: t.qrPayload,
            attendeeName: t.orderItem.attendeeName,
            ticketCategoryName: t.orderItem.ticketCategory.name,
        }));
    }
    async getAssignedEvents(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User tidak ditemukan');
        }
        if (user.role === 'organizer') {
            const organizer = await this.prisma.organizer.findFirst({
                where: { userId },
            });
            if (!organizer)
                return [];
            return this.prisma.event.findMany({
                where: { organizerId: organizer.id },
            });
        }
        const gateStaffs = await this.prisma.gateStaff.findMany({
            where: { userId },
            include: { event: true },
        });
        return gateStaffs.map((gs) => gs.event);
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