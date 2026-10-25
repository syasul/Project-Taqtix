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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const crypto = __importStar(require("crypto"));
let UploadService = UploadService_1 = class UploadService {
    configService;
    logger = new common_1.Logger(UploadService_1.name);
    uploadDir;
    publicBaseUrl;
    constructor(configService) {
        this.configService = configService;
        this.uploadDir = this.resolveActiveUploadDir();
        const configuredPublicUrl = this.configService.get('UPLOAD_PUBLIC_BASE_URL');
        const isProd = process.env.NODE_ENV === 'production';
        if (isProd) {
            if (configuredPublicUrl &&
                !configuredPublicUrl.includes('localhost') &&
                !configuredPublicUrl.includes('127.0.0.1')) {
                this.publicBaseUrl = configuredPublicUrl;
            }
            else {
                const taqtixBase = this.configService.get('TAQTIX_BASE_URL') ||
                    'https://api.taqtix.id';
                this.publicBaseUrl = `${taqtixBase.replace(/\/+$/, '')}/uploads`;
            }
        }
        else {
            this.publicBaseUrl =
                configuredPublicUrl ||
                    `http://localhost:${this.configService.get('PORT') || '3000'}/uploads`;
        }
    }
    resolveActiveUploadDir() {
        const rawConfiguredPath = this.configService.get('UPLOAD_STORAGE_PATH') ||
            path.join(process.cwd(), 'uploads');
        const cleanConfigured = rawConfiguredPath.replace(/^["']|["']$/g, '').trim();
        const configuredPath = path.isAbsolute(cleanConfigured)
            ? cleanConfigured
            : path.resolve(process.cwd(), cleanConfigured);
        const candidates = [
            configuredPath,
            path.resolve(process.cwd(), 'uploads'),
            path.resolve(__dirname, '../../../../uploads'),
            path.join(os.tmpdir(), 'taqtix-uploads'),
        ];
        for (const dir of candidates) {
            try {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
                }
                fs.accessSync(dir, fs.constants.W_OK);
                return dir;
            }
            catch (err) {
                this.logger.warn(`Direktori upload ${dir} tidak dapat ditulis, mencoba kandidat berikutnya...`);
            }
        }
        const fallbackPath = path.join(os.tmpdir(), 'taqtix-uploads');
        try {
            if (!fs.existsSync(fallbackPath)) {
                fs.mkdirSync(fallbackPath, { recursive: true, mode: 0o777 });
            }
        }
        catch { }
        return fallbackPath;
    }
    getUploadDir() {
        return this.uploadDir;
    }
    async processUploadedFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('Tidak ada berkas file yang diunggah');
        }
        const targetDir = this.resolveActiveUploadDir();
        const ext = path.extname(file.originalname).toLowerCase() ||
            (file.mimetype === 'image/webp'
                ? '.webp'
                : file.mimetype === 'image/jpeg'
                    ? '.jpg'
                    : '.png');
        const cleanBase = path
            .basename(file.originalname, ext)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const filename = file.filename || `${cleanBase}-${uniqueSuffix}${ext}`;
        const destinationPath = path.join(targetDir, filename);
        if (file.buffer && file.buffer.length > 0) {
            try {
                await fs.promises.writeFile(destinationPath, file.buffer);
            }
            catch (writeErr) {
                this.logger.error(`Gagal menulis file ke ${destinationPath}:`, writeErr);
                const emergencyDir = path.join(os.tmpdir(), 'taqtix-uploads');
                if (!fs.existsSync(emergencyDir)) {
                    fs.mkdirSync(emergencyDir, { recursive: true, mode: 0o777 });
                }
                await fs.promises.writeFile(path.join(emergencyDir, filename), file.buffer);
            }
        }
        else if (file.path && fs.existsSync(file.path)) {
            if (path.resolve(file.path) !== path.resolve(destinationPath)) {
                try {
                    await fs.promises.copyFile(file.path, destinationPath);
                }
                catch {
                }
            }
        }
        const cleanBaseUrl = this.publicBaseUrl.replace(/\/+$/, '');
        const fileUrl = `${cleanBaseUrl}/${filename}`;
        return {
            url: fileUrl,
            filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map