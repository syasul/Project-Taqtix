"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOKU_BASE_URL = void 0;
exports.getDokuConfig = getDokuConfig;
exports.DOKU_BASE_URL = process.env.DOKU_ENV === 'production'
    ? 'https://api.doku.com'
    : 'https://api-sandbox.doku.com';
function getDokuConfig(configService) {
    const getVal = (key) => {
        if (configService) {
            return configService.get(key) || process.env[key] || '';
        }
        return process.env[key] || '';
    };
    const clientId = getVal('DOKU_CLIENT_ID') || getVal('PAYMENT_PROVIDER_KEY') || '';
    const secretKey = getVal('DOKU_SECRET_KEY') || getVal('PAYMENT_PROVIDER_SECRET') || '';
    const envRaw = (getVal('DOKU_ENV') ||
        (getVal('NODE_ENV') === 'production' ? 'production' : 'sandbox')).toLowerCase();
    const env = envRaw === 'production' ? 'production' : 'sandbox';
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
//# sourceMappingURL=doku.config.js.map