import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private readonly configService;
    private readonly logger;
    private uploadDir;
    private publicBaseUrl;
    constructor(configService: ConfigService);
    private resolveActiveUploadDir;
    getUploadDir(): string;
    processUploadedFile(file: Express.Multer.File): Promise<{
        url: string;
        filename: string;
        originalName: string;
        mimetype: string;
        size: number;
    }>;
}
