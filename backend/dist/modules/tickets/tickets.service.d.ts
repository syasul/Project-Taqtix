import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';
import { UpdateTicketCategoryDto } from './dto/update-ticket-category.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
export declare class TicketsService {
    private prisma;
    constructor(prisma: PrismaService);
    private verifyEventOwnership;
    createCategory(eventId: string, dto: CreateTicketCategoryDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        price: number;
        quota: number;
        sold: number;
        maxPerOrder: number;
        saleStartAt: Date;
        saleEndAt: Date;
    }>;
    updateCategory(id: string, dto: UpdateTicketCategoryDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        price: number;
        quota: number;
        sold: number;
        maxPerOrder: number;
        saleStartAt: Date;
        saleEndAt: Date;
    }>;
    getCategories(eventId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        price: number;
        quota: number;
        sold: number;
        maxPerOrder: number;
        saleStartAt: Date;
        saleEndAt: Date;
    }[]>;
    createPromoCode(eventId: string, dto: CreatePromoCodeDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        code: string;
        discount: number;
        maxUsage: number;
        usedCount: number;
    }>;
    validatePromoCode(dto: ValidatePromoCodeDto): Promise<{
        valid: boolean;
        voucherId: string;
        code: string;
        type: string;
        value: number;
        maxDiscountAmount: number | null;
        promoCodeId?: undefined;
        discount?: undefined;
    } | {
        valid: boolean;
        promoCodeId: string;
        code: string;
        discount: number;
        voucherId?: undefined;
        type?: undefined;
        value?: undefined;
        maxDiscountAmount?: undefined;
    }>;
    getTicket(ticketId: string): Promise<{
        ticketId: string;
        ticketStatus: import("@prisma/client").$Enums.TicketStatus;
        ticketCategory: string;
        buyerName: string;
        buyerEmail: string;
        eventTitle: string;
        eventLocation: string;
        eventStartDate: Date;
        eventEndDate: Date;
        organizerName: string;
        signedQrPayload: string;
    }>;
    getTicketsByOrder(orderId: string): Promise<{
        ticketId: string;
        ticketStatus: import("@prisma/client").$Enums.TicketStatus;
        ticketCategory: string;
        buyerName: string;
        buyerEmail: string;
        eventTitle: string;
        signedQrPayload: string;
    }[]>;
    blockTicket(ticketId: string, reason: string | undefined, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        qrPayload: string;
        orderItemId: string;
        checkedInAt: Date | null;
        checkedInBy: string | null;
        checkedOutAt: Date | null;
        checkedOutBy: string | null;
        wristbandCode: string | null;
        wristbandPrintedAt: Date | null;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedBy: string | null;
        blockedAt: Date | null;
    }>;
    unblockTicket(ticketId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        qrPayload: string;
        orderItemId: string;
        checkedInAt: Date | null;
        checkedInBy: string | null;
        checkedOutAt: Date | null;
        checkedOutBy: string | null;
        wristbandCode: string | null;
        wristbandPrintedAt: Date | null;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedBy: string | null;
        blockedAt: Date | null;
    }>;
    getBlockedVisitors(eventId: string, userId: string): Promise<({
        orderItem: {
            ticketCategory: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                eventId: string;
                price: number;
                quota: number;
                sold: number;
                maxPerOrder: number;
                saleStartAt: Date;
                saleEndAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            facilities: import("@prisma/client/runtime/library").JsonValue | null;
            orderId: string;
            ticketCategoryId: string;
            qty: number;
            unitPrice: number;
            attendeeName: string;
            attendeeEmail: string;
            attendeePhone: string;
            city: string | null;
            customFieldAnswers: import("@prisma/client/runtime/library").JsonValue | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        qrPayload: string;
        orderItemId: string;
        checkedInAt: Date | null;
        checkedInBy: string | null;
        checkedOutAt: Date | null;
        checkedOutBy: string | null;
        wristbandCode: string | null;
        wristbandPrintedAt: Date | null;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedBy: string | null;
        blockedAt: Date | null;
    })[]>;
    generateWristbandCodes(eventId: string, userId: string): Promise<{
        success: boolean;
        message: string;
        generatedCount: number;
    }>;
    exportWristbandCsv(eventId: string, userId: string): Promise<{
        filename: string;
        csv: string;
    }>;
    getMyTickets(userId: string): Promise<({
        event: {
            title: string;
            id: string;
            slug: string;
            location: string;
            startDate: Date;
            endDate: Date;
            bannerUrl: string;
        };
        orderItem: {
            ticketCategory: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                eventId: string;
                price: number;
                quota: number;
                sold: number;
                maxPerOrder: number;
                saleStartAt: Date;
                saleEndAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            facilities: import("@prisma/client/runtime/library").JsonValue | null;
            orderId: string;
            ticketCategoryId: string;
            qty: number;
            unitPrice: number;
            attendeeName: string;
            attendeeEmail: string;
            attendeePhone: string;
            city: string | null;
            customFieldAnswers: import("@prisma/client/runtime/library").JsonValue | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        qrPayload: string;
        orderItemId: string;
        checkedInAt: Date | null;
        checkedInBy: string | null;
        checkedOutAt: Date | null;
        checkedOutBy: string | null;
        wristbandCode: string | null;
        wristbandPrintedAt: Date | null;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedBy: string | null;
        blockedAt: Date | null;
    })[]>;
}
