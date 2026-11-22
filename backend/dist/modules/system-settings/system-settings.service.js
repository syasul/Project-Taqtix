"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SystemSettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SystemSettingsService = SystemSettingsService_1 = class SystemSettingsService {
    prisma;
    logger = new common_1.Logger(SystemSettingsService_1.name);
    memoryCache = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSetting(key, defaultValue = '') {
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key);
        }
        try {
            const setting = await this.prisma.systemSetting.findUnique({
                where: { key },
            });
            const val = setting ? setting.value : defaultValue;
            this.memoryCache.set(key, val);
            return val;
        }
        catch (err) {
            this.logger.warn(`Could not read SystemSetting "${key}": ${err?.message}`);
            return defaultValue;
        }
    }
    async setSetting(key, value, description, adminId) {
        try {
            const updated = await this.prisma.systemSetting.upsert({
                where: { key },
                create: { key, value, description },
                update: { value, description },
            });
            this.memoryCache.set(key, updated.value);
            if (adminId) {
                try {
                    await this.prisma.auditLog.create({
                        data: {
                            adminId,
                            action: 'UPDATE_SYSTEM_SETTING',
                            targetId: key,
                            targetType: 'system_setting',
                            details: { key, value, description },
                        },
                    });
                }
                catch { }
            }
            return updated.value;
        }
        catch (err) {
            this.logger.error(`Could not write SystemSetting "${key}": ${err?.message}`);
            this.memoryCache.set(key, value);
            return value;
        }
    }
    async getAllPlatformFeatures() {
        const [allowGuestCheckoutFeature, allowSeatingLayoutFeature, allowAffiliatesProgramFeature, allowTicketTransferFeature, allowEoFeedFeature, allowPosCashFeature, allowCustomFieldsFeature, allowDoorprizeFeature,] = await Promise.all([
            this.isFeatureEnabled('ALLOW_GUEST_CHECKOUT', true),
            this.isFeatureEnabled('ALLOW_SEATING_LAYOUT', true),
            this.isFeatureEnabled('ALLOW_AFFILIATES_PROGRAM', true),
            this.isFeatureEnabled('ALLOW_TICKET_TRANSFER', true),
            this.isFeatureEnabled('ALLOW_EO_FEED', true),
            this.isFeatureEnabled('ALLOW_POS_CASH', true),
            this.isFeatureEnabled('ALLOW_CUSTOM_FIELDS', true),
            this.isFeatureEnabled('ALLOW_DOORPRIZE', true),
        ]);
        return {
            allowGuestCheckoutFeature,
            allowSeatingLayoutFeature,
            allowAffiliatesProgramFeature,
            allowTicketTransferFeature,
            allowEoFeedFeature,
            allowPosCashFeature,
            allowCustomFieldsFeature,
            allowDoorprizeFeature,
        };
    }
    async isFeatureEnabled(key, defaultValue = true) {
        const val = await this.getSetting(key, defaultValue ? 'true' : 'false');
        return val === 'true';
    }
    async setFeatureEnabled(key, enabled, description, adminId) {
        await this.setSetting(key, enabled ? 'true' : 'false', description || `Kontrol global fitur platform: ${key}`, adminId);
        return enabled;
    }
    async isGuestCheckoutFeatureEnabled() {
        return this.isFeatureEnabled('ALLOW_GUEST_CHECKOUT', true);
    }
    async setGuestCheckoutFeatureEnabled(enabled, adminId) {
        return this.setFeatureEnabled('ALLOW_GUEST_CHECKOUT', enabled, 'Kontrol global fitur pembelian tiket tanpa login (Guest Checkout) untuk EO', adminId);
    }
};
exports.SystemSettingsService = SystemSettingsService;
exports.SystemSettingsService = SystemSettingsService = SystemSettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SystemSettingsService);
//# sourceMappingURL=system-settings.service.js.map