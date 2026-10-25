import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
export declare class VouchersController {
    private readonly vouchersService;
    constructor(vouchersService: VouchersService);
    create(dto: CreateVoucherDto, userId: string): Promise<{
        type: string;
        value: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        organizerId: string;
        eventId: string | null;
        code: string;
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
        value: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        organizerId: string;
        eventId: string | null;
        code: string;
        usageLimit: number | null;
        usageCount: number;
        maxDiscountAmount: number | null;
        validFrom: Date;
        validUntil: Date;
        applicableEventIds: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    update(id: string, dto: UpdateVoucherDto, userId: string): Promise<{
        type: string;
        value: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        organizerId: string;
        eventId: string | null;
        code: string;
        usageLimit: number | null;
        usageCount: number;
        maxDiscountAmount: number | null;
        validFrom: Date;
        validUntil: Date;
        applicableEventIds: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    deactivate(id: string, userId: string): Promise<{
        type: string;
        value: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        organizerId: string;
        eventId: string | null;
        code: string;
        usageLimit: number | null;
        usageCount: number;
        maxDiscountAmount: number | null;
        validFrom: Date;
        validUntil: Date;
        applicableEventIds: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
