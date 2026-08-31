import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
export declare class VouchersController {
    private readonly vouchersService;
    constructor(vouchersService: VouchersService);
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
    findAll(eventId: string, userId: string): Promise<({
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
}
