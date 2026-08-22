import { TicketsService } from './tickets.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';
import { UpdateTicketCategoryDto } from './dto/update-ticket-category.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
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
        promoCodeId: string;
        code: string;
        discount: number;
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
}
