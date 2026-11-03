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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UploadsServeController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsServeController = void 0;
const common_1 = require("@nestjs/common");
const express = __importStar(require("express"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const public_decorator_1 = require("../../common/decorators/public.decorator");
let UploadsServeController = UploadsServeController_1 = class UploadsServeController {
    logger = new common_1.Logger(UploadsServeController_1.name);
    serveFile(filename, res) {
        if (!filename) {
            throw new common_1.NotFoundException('Nama berkas tidak valid');
        }
        const safeFilename = path.basename(filename);
        const candidates = [
            path.resolve(process.cwd(), 'uploads', safeFilename),
            path.resolve(process.cwd(), '../uploads', safeFilename),
            path.resolve(process.cwd(), 'backend/uploads', safeFilename),
            path.resolve(__dirname, '../../../../uploads', safeFilename),
            path.resolve(__dirname, '../../../../../uploads', safeFilename),
            path.join(os.tmpdir(), 'taqtix-uploads', safeFilename),
            `/root/Project-Taqtix/backend/uploads/${safeFilename}`,
            `/root/Project-Taqtix/uploads/${safeFilename}`,
            `/var/www/taqtix/backend/uploads/${safeFilename}`,
            `/var/www/taqtix/uploads/${safeFilename}`,
        ];
        for (const filePath of candidates) {
            if (fs.existsSync(filePath)) {
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                return res.sendFile(filePath);
            }
        }
        this.logger.warn(`[UploadsServeController] Berkas "${safeFilename}" tidak ditemukan di kandidat path: ${candidates.slice(0, 4).join(', ')}`);
        throw new common_1.NotFoundException(`Berkas "${safeFilename}" tidak ditemukan di server`);
    }
};
exports.UploadsServeController = UploadsServeController;
__decorate([
    (0, common_1.Get)(':filename'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UploadsServeController.prototype, "serveFile", null);
exports.UploadsServeController = UploadsServeController = UploadsServeController_1 = __decorate([
    (0, common_1.Controller)(['uploads', 'v1/uploads'])
], UploadsServeController);
//# sourceMappingURL=uploads-serve.controller.js.map