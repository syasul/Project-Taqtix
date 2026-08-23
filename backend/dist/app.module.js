"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const bull_1 = require("@nestjs/bull");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const events_module_1 = require("./modules/events/events.module");
const tickets_module_1 = require("./modules/tickets/tickets.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const gate_module_1 = require("./modules/gate/gate.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const affiliates_module_1 = require("./modules/affiliates/affiliates.module");
const team_module_1 = require("./modules/team/team.module");
const workforce_module_1 = require("./modules/workforce/workforce.module");
const crm_module_1 = require("./modules/crm/crm.module");
const admin_module_1 = require("./modules/admin/admin.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const permission_guard_1 = require("./common/guards/permission.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
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
            auth_module_1.AuthModule,
            events_module_1.EventsModule,
            tickets_module_1.TicketsModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
            gate_module_1.GateModule,
            dashboard_module_1.DashboardModule,
            affiliates_module_1.AffiliatesModule,
            team_module_1.TeamModule,
            workforce_module_1.WorkforceModule,
            crm_module_1.CRMModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permission_guard_1.PermissionGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map