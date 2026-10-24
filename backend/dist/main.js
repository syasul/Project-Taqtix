"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const express = __importStar(require("express"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
    const rawUploadPath = process.env.UPLOAD_STORAGE_PATH || path.join(process.cwd(), 'uploads');
    const cleanUploadPath = rawUploadPath.replace(/^["']|["']$/g, '').trim();
    const uploadPath = path.isAbsolute(cleanUploadPath)
        ? cleanUploadPath
        : path.resolve(process.cwd(), cleanUploadPath);
    try {
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
        }
        const staticOptions = {
            setHeaders: (res) => {
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                res.setHeader('Access-Control-Allow-Origin', '*');
            },
        };
        app.use('/uploads', express.static(uploadPath, staticOptions));
        app.use('/v1/uploads', express.static(uploadPath, staticOptions));
        const localUploads = path.resolve(process.cwd(), 'uploads');
        if (localUploads !== uploadPath) {
            if (!fs.existsSync(localUploads)) {
                fs.mkdirSync(localUploads, { recursive: true, mode: 0o755 });
            }
            app.use('/uploads', express.static(localUploads, staticOptions));
            app.use('/v1/uploads', express.static(localUploads, staticOptions));
        }
        const tmpUploads = path.join(os.tmpdir(), 'taqtix-uploads');
        if (fs.existsSync(tmpUploads)) {
            app.use('/uploads', express.static(tmpUploads, staticOptions));
            app.use('/v1/uploads', express.static(tmpUploads, staticOptions));
        }
    }
    catch (err) {
        console.warn('[Main] Gagal menginisialisasi static upload handler:', err);
    }
    app.setGlobalPrefix('v1', {
        exclude: ['payments/webhook/(.*)', 'payments/webhook'],
    });
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.use(express.json({
        limit: '25mb',
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    }));
    app.use(express.urlencoded({ limit: '25mb', extended: true }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: common_1.HttpStatus.UNPROCESSABLE_ENTITY,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('TAQtix REST API')
        .setDescription('Dokumentasi API Core Engine Ticketing & Afiliasi TAQtix')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`TAQtix Backend berjalan pada: http://localhost:${port}/v1`);
    console.log(`Dokumentasi API (Swagger) tersedia di: http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map