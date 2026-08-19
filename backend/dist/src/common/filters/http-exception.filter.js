"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_SERVER_ERROR';
        let message = 'Terjadi kesalahan internal pada server';
        let details = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resObj = exceptionResponse;
                message = resObj.message || message;
                details = resObj.error || resObj.details || undefined;
                if (status === common_1.HttpStatus.BAD_REQUEST) {
                    code = 'BAD_REQUEST';
                    if (Array.isArray(resObj.message)) {
                        code = 'VALIDATION_ERROR';
                        message = 'Validasi input gagal';
                        details = resObj.message;
                    }
                }
                else if (status === common_1.HttpStatus.UNAUTHORIZED) {
                    code = 'UNAUTHORIZED';
                }
                else if (status === common_1.HttpStatus.FORBIDDEN) {
                    code = 'FORBIDDEN';
                }
                else if (status === common_1.HttpStatus.NOT_FOUND) {
                    code = 'NOT_FOUND';
                }
                else if (status === common_1.HttpStatus.CONFLICT) {
                    code = 'CONFLICT';
                }
            }
        }
        else {
            if (exception instanceof Error) {
                message = exception.message;
                if (process.env.NODE_ENV !== 'production') {
                    details = exception.stack;
                }
            }
        }
        response.status(status).json({
            code,
            message,
            ...(details ? { details } : {}),
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map