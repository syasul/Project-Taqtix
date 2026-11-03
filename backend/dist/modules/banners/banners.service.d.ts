import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
export declare class BannersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPublicBanners(position?: string): Promise<{
        order: number;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string;
        subtitle: string | null;
        targetUrl: string | null;
        position: string;
        isActive: boolean;
    }[]>;
    getAdminBanners(): Promise<{
        order: number;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string;
        subtitle: string | null;
        targetUrl: string | null;
        position: string;
        isActive: boolean;
    }[]>;
    createBanner(dto: CreateBannerDto): Promise<{
        order: number;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string;
        subtitle: string | null;
        targetUrl: string | null;
        position: string;
        isActive: boolean;
    }>;
    updateBanner(id: string, dto: UpdateBannerDto): Promise<{
        order: number;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string;
        subtitle: string | null;
        targetUrl: string | null;
        position: string;
        isActive: boolean;
    }>;
    deleteBanner(id: string): Promise<{
        id: string;
        message: string;
    }>;
}
