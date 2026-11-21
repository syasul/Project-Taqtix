import { OrganizersService } from './organizers.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FollowOrganizerDto } from './dto/follow-organizer.dto';
export declare class OrganizersController {
    private readonly organizersService;
    constructor(organizersService: OrganizersService);
    getPublicOrganizer(slug: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    toggleFollow(slug: string, dto: FollowOrganizerDto): Promise<{
        isFollowing: boolean;
        followerCount: number;
        message: string;
        success: boolean;
    }>;
    checkFollowing(slug: string, email: string): Promise<{
        isFollowing: boolean;
        success: boolean;
    }>;
    getPublicPosts(slug: string, page?: string, limit?: string): Promise<{
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
        success: boolean;
    }>;
    getOrganizerPosts(userId: string): Promise<{
        success: boolean;
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
    }>;
    createPost(userId: string, dto: CreatePostDto): Promise<{
        success: boolean;
        data: {
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
        };
        message: string;
    }>;
    deletePost(userId: string, postId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getFollowers(userId: string, page?: string, limit?: string, search?: string): Promise<{
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
        success: boolean;
    }>;
}
