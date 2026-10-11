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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderCheckoutProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
const orders_service_1 = require("./orders.service");
let OrderCheckoutProcessor = class OrderCheckoutProcessor {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async handleProcessCheckout(job) {
        const { dto, authenticatedUserId, idempotencyKey } = job.data;
        try {
            const order = await this.ordersService.create(dto, authenticatedUserId, idempotencyKey);
            return {
                orderId: order.id,
                paymentUrl: order.paymentUrl || null,
                totalAmount: order.totalAmount,
            };
        }
        catch (err) {
            let errMsg = 'Gagal memproses pesanan pada antrean.';
            if (err?.response) {
                if (typeof err.response === 'string') {
                    errMsg = err.response;
                }
                else if (err.response.message) {
                    errMsg = Array.isArray(err.response.message)
                        ? err.response.message.join(', ')
                        : err.response.message;
                }
            }
            else if (err?.message) {
                errMsg = err.message;
            }
            throw new Error(errMsg);
        }
    }
};
exports.OrderCheckoutProcessor = OrderCheckoutProcessor;
__decorate([
    (0, bull_1.Process)({ name: 'process-checkout', concurrency: 10 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_1.Job]),
    __metadata("design:returntype", Promise)
], OrderCheckoutProcessor.prototype, "handleProcessCheckout", null);
exports.OrderCheckoutProcessor = OrderCheckoutProcessor = __decorate([
    (0, bull_1.Processor)('order-checkout-queue'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrderCheckoutProcessor);
//# sourceMappingURL=order-checkout.processor.js.map