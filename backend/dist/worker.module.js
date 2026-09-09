"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const orders_module_1 = require("./modules/orders/orders.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const crm_module_1 = require("./modules/crm/crm.module");
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            bull_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const redisUrl = config.get('REDIS_URL') || 'redis://localhost:6379';
                    try {
                        const parsed = new URL(redisUrl);
                        return {
                            redis: {
                                host: parsed.hostname,
                                port: parseInt(parsed.port || '6379', 10),
                                username: parsed.username || undefined,
                                password: parsed.password || undefined,
                            },
                        };
                    }
                    catch {
                        return {
                            redis: {
                                host: 'localhost',
                                port: 6379,
                            },
                        };
                    }
                },
            }),
            prisma_module_1.PrismaModule,
            orders_module_1.OrdersModule,
            notifications_module_1.NotificationsModule,
            crm_module_1.CRMModule,
        ],
    })
], WorkerModule);
//# sourceMappingURL=worker.module.js.map