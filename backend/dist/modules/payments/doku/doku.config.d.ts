import { ConfigService } from '@nestjs/config';
export interface DokuConfig {
    clientId: string;
    secretKey: string;
    env: 'sandbox' | 'production';
    isProduction: boolean;
    baseUrl: string;
}
export declare const DOKU_BASE_URL: string;
export declare function getDokuConfig(configService?: ConfigService): DokuConfig;
