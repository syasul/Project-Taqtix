import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FollowOrganizerDto } from './dto/follow-organizer.dto';
export declare class OrganizersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerId;
    getPublicOrganizer(slug: string): Promise<{
        organizer: {
            followerCount: number;
            eventCount: number;
            id: string;
            createdAt: Date;
            name: string;
            slug: string;
            phone: string | null;
            logoUrl: string | null;
            bannerUrl: string | null;
            bio: string | null;
            contactEmail: string | null;
            website: string | null;
            instagram: string | null;
            tiktok: string | null;
            youtube: string | null;
        };
        upcomingEvents: {
            id: string;
            title: string;
            slug: string;
            bannerUrl: string;
            location: string;
            startDate: Date;
            endDate: Date;
            lowestPrice: number;
        }[];
        pastEvents: {
            id: string;
            title: string;
            slug: string;
            bannerUrl: string;
            location: string;
            startDate: Date;
            endDate: Date;
            lowestPrice: number;
        }[];
        posts: ({
            event: {
                title: string;
                id: string;
                slug: string;
            } | null;
        } & {
            content: string;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizerId: string;
            eventId: string | null;
            imageUrl: string | null;
        })[];
        affiliateProgram: {
            active: boolean;
            title: string;
            description: string;
            portalUrl: string;
        };
    }>;
    toggleFollow(slug: string, dto: FollowOrganizerDto, userId?: string): Promise<{
        isFollowing: boolean;
        followerCount: number;
        message: string;
    }>;
    checkFollowing(slug: string, email: string): Promise<{
        isFollowing: boolean;
    }>;
    getPublicPosts(slug: string, page?: number, limit?: number): Promise<{
        data: ({
            event: {
                title: string;
                id: string;
                slug: string;
            } | null;
        } & {
            content: string;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizerId: string;
            eventId: string | null;
            imageUrl: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getOrganizerPosts(userId: string): Promise<({
        event: {
            title: string;
            id: string;
            slug: string;
        } | null;
    } & {
        content: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizerId: string;
        eventId: string | null;
        imageUrl: string | null;
    })[]>;
    createPost(userId: string, dto: CreatePostDto): Promise<{
        event: {
            title: string;
            id: string;
            slug: string;
        } | null;
    } & {
        content: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizerId: string;
        eventId: string | null;
        imageUrl: string | null;
    }>;
    deletePost(userId: string, postId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getFollowers(userId: string, page?: number, limit?: number, search?: string): Promise<{
        data: {
            email: string;
            id: string;
            createdAt: Date;
            name: string | null;
            userId: string | null;
            organizerId: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
