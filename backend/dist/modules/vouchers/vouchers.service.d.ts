import { PrismaService } from '../prisma/prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
export declare class VouchersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerOrThrow;
    create(dto: CreateVoucherDto, userId: string): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string | null;
        organizerId: string;
        status: string;
        code: string;
        value: number;
        usageLimit: number | null;
        usageCount: number;
        maxDiscountAmount: number | null;
        validFrom: Date;
        validUntil: Date;
        applicableEventIds: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(userId: string, eventId?: string): Promise<({
        event: {
            title: string;
            id: string;
        } | null;
    } & {
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string | null;
        organizerId: string;
        status: string;
        code: string;
        value: number;
        usageLimit: number | null;
        usageCount: number;
        maxDiscountAmount: number | null;
        validFrom: Date;
        validUntil: Date;
        applicableEventIds: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    update(id: string, dto: UpdateVoucherDto, userId: string): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string | null;
        organizerId: string;
        status: string;
        code: string;
        value: number;
        usageLimit: number | null;
        usageCount: number;
        maxDiscountAmount: number | null;
        validFrom: Date;
        validUntil: Date;
        applicableEventIds: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    deactivate(id: string, userId: string): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string | null;
        organizerId: string;
        status: string;
        code: string;
        value: number;
        usageLimit: number | null;
        usageCount: number;
        maxDiscountAmount: number | null;
        validFrom: Date;
        validUntil: Date;
        applicableEventIds: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    validateVoucher(code: string, eventId: string, totalAmount: number): Promise<{
        valid: boolean;
        voucherId: string;
        code: string;
        type: string;
        value: number;
        discountAmount: number;
    }>;
}
