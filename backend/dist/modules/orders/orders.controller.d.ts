import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    private readonly jwtService;
    private readonly configService;
    constructor(ordersService: OrdersService, jwtService: JwtService, configService: ConfigService);
    createOrder(dto: CreateOrderDto, req: Request): Promise<any>;
    enqueueOrder(dto: CreateOrderDto, req: Request): Promise<{
        status: string;
        queueId: string;
        position: number;
        data: {
            orderId: any;
            paymentUrl: any;
            totalAmount: any;
        };
        estimatedWaitSeconds?: undefined;
        message?: undefined;
    } | {
        status: string;
        queueId: string;
        position: number;
        estimatedWaitSeconds: number;
        message: string;
        data?: undefined;
    }>;
    getQueueStatus(queueId: string): Promise<{
        status: string;
        queueId: string;
        position: number;
        data: any;
        error?: undefined;
        estimatedWaitSeconds?: undefined;
        message?: undefined;
    } | {
        status: string;
        queueId: string;
        position: number;
        error: string;
        data?: undefined;
        estimatedWaitSeconds?: undefined;
        message?: undefined;
    } | {
        status: string;
        queueId: string;
        position: number;
        estimatedWaitSeconds: number;
        message: string;
        data?: undefined;
        error?: undefined;
    }>;
    getMyOrders(userId: string): Promise<({
        event: {
            title: string;
            id: string;
            slug: string;
            location: string;
            isDateTba: boolean;
            startDate: Date;
            endDate: Date;
            bannerUrl: string;
        };
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PaymentStatus;
            orderId: string;
            provider: string;
            snapToken: string | null;
            externalId: string | null;
            amount: number;
            paidAt: Date | null;
        } | null;
        orderItems: ({
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
                ticketPerPackage: number;
                saleStartAt: Date;
                saleEndAt: Date;
            };
            tickets: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.TicketStatus;
                eventId: string;
                qrPayload: string;
                orderItemId: string;
                attendeeName: string | null;
                attendeeGender: string | null;
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
            }[];
        } & {
            id: string;
            createdAt: Date;
            facilities: import("@prisma/client/runtime/library").JsonValue | null;
            attendeeName: string;
            orderId: string;
            ticketCategoryId: string;
            qty: number;
            unitPrice: number;
            attendeeEmail: string;
            attendeePhone: string;
            city: string | null;
            customFieldAnswers: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        eventId: string;
        promoCodeId: string | null;
        buyerId: string;
        totalAmount: number;
        discountAmount: number;
        partnerId: string | null;
        utmSource: string | null;
        utmMedium: string | null;
        utmCampaign: string | null;
        expiredAt: Date;
    })[]>;
    getOrder(id: string): Promise<{
        event: {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            status: import("@prisma/client").$Enums.EventStatus;
            organizerId: string;
            location: string;
            isDateTba: boolean;
            startDate: Date;
            endDate: Date;
            bannerUrl: string;
            requireLogin: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            seoKeywords: string | null;
            adminSeoKeywords: string | null;
            seoPriority: string | null;
            geofenceLat: number | null;
            geofenceLng: number | null;
            geofenceRadius: number | null;
            allowTicketTransfer: boolean;
        };
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PaymentStatus;
            orderId: string;
            provider: string;
            snapToken: string | null;
            externalId: string | null;
            amount: number;
            paidAt: Date | null;
        } | null;
        buyer: {
            email: string;
            role: string;
            id: string;
            passwordHash: string;
            activeDeviceId: string | null;
            lastLoginAt: Date | null;
            lastLogoutAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        orderItems: ({
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
                ticketPerPackage: number;
                saleStartAt: Date;
                saleEndAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            facilities: import("@prisma/client/runtime/library").JsonValue | null;
            attendeeName: string;
            orderId: string;
            ticketCategoryId: string;
            qty: number;
            unitPrice: number;
            attendeeEmail: string;
            attendeePhone: string;
            city: string | null;
            customFieldAnswers: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        eventId: string;
        promoCodeId: string | null;
        buyerId: string;
        totalAmount: number;
        discountAmount: number;
        partnerId: string | null;
        utmSource: string | null;
        utmMedium: string | null;
        utmCampaign: string | null;
        expiredAt: Date;
    }>;
}
