import { ConfigService } from '@nestjs/config';

export interface DokuConfig {
  clientId: string;
  secretKey: string;
  env: 'sandbox' | 'production';
  isProduction: boolean;
  baseUrl: string;
}

/**
 * Base URL default resmi DOKU
 */
export const DOKU_BASE_URL =
  process.env.DOKU_ENV === 'production'
    ? 'https://api.doku.com'
    : 'https://api-sandbox.doku.com';

/**
 * Membaca konfigurasi DOKU dari ConfigService NestJS atau process.env
 */
export function getDokuConfig(configService?: ConfigService): DokuConfig {
  const getVal = (key: string): string => {
    if (configService) {
      return configService.get<string>(key) || process.env[key] || '';
    }
    return process.env[key] || '';
  };

  const clientId =
    getVal('DOKU_CLIENT_ID') || getVal('PAYMENT_PROVIDER_KEY') || '';
  const secretKey =
    getVal('DOKU_SECRET_KEY') || getVal('PAYMENT_PROVIDER_SECRET') || '';

  // Kredensial dengan prefix "BRN-" adalah Production Merchant ID resmi DOKU.
  const isBrnProdKey = clientId.startsWith('BRN-');
  const envRaw = (
    getVal('DOKU_ENV') ||
    (getVal('NODE_ENV') === 'production' || isBrnProdKey ? 'production' : 'sandbox')
  ).toLowerCase();
  const env: 'sandbox' | 'production' =
    envRaw === 'production' || isBrnProdKey ? 'production' : 'sandbox';
  const isProduction = env === 'production';

  const baseUrl = isProduction
    ? getVal('DOKU_BASE_URL_PRODUCTION') || 'https://api.doku.com'
    : getVal('DOKU_BASE_URL_SANDBOX') || 'https://api-sandbox.doku.com';

  return {
    clientId,
    secretKey,
    env,
    isProduction,
    baseUrl,
  };
}
