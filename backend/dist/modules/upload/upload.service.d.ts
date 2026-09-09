import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private readonly configService;
    private uploadDir;
    private publicBaseUrl;
    constructor(configService: ConfigService);
    getUploadDir(): string;
    processUploadedFile(file: Express.Multer.File): {
        url: string;
        filename: string;
        originalName: string;
        mimetype: string;
        size: number;
    };
}
