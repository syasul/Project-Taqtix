import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
export declare class BannersController {
    private readonly bannersService;
    constructor(bannersService: BannersService);
    getPublicBanners(position?: string): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    getAdminBanners(): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    createBanner(dto: CreateBannerDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    updateBanner(id: string, dto: UpdateBannerDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    deleteBanner(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            message: string;
        };
    }>;
}
