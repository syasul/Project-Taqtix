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
        price: number;
        eventId: string;
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
        price: number;
        eventId: string;
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
        price: number;
        eventId: string;
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
        promoCodeId: string;
        code: string;
        discount: number;
    }>;
}
