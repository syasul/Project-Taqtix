"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const worker_module_1 = require("./worker.module");
const common_1 = require("@nestjs/common");
async function bootstrapWorker() {
    const logger = new common_1.Logger('TAQtixWorker');
    const app = await core_1.NestFactory.createApplicationContext(worker_module_1.WorkerModule);
    logger.log('====================================================');
    logger.log('🚀 TAQtix BullMQ Worker Process Berjalan Sukses');
    logger.log('⚡ Antrean Aktif: orders, notifications, broadcast');
    logger.log('   (Berjalan pada proses mandiri tanpa HTTP overhead)');
    logger.log('====================================================');
    const shutdown = async (signal) => {
        logger.log(`Menerima sinyal ${signal}. Menghentikan worker secara aman (graceful shutdown)...`);
        await app.close();
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
bootstrapWorker();
//# sourceMappingURL=worker.js.map