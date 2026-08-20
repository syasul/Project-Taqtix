import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Filter exception global untuk menstandarkan format error API response.
 * Hasil akhir format error adalah: { code, message, details? }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Terjadi kesalahan internal pada server';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as any;
        message = resObj.message || message;
        details = resObj.error || resObj.details || undefined;
        code = resObj.code || code;
        
        // Peta kode error berdasarkan HTTP status jika kode belum diset secara eksplisit
        if (!resObj.code) {
          if (status === HttpStatus.BAD_REQUEST) {
            code = 'BAD_REQUEST';
            if (Array.isArray(resObj.message)) {
              code = 'VALIDATION_ERROR';
              message = 'Validasi input gagal';
              details = resObj.message;
            }
          } else if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
            code = 'VALIDATION_ERROR';
            if (Array.isArray(resObj.message)) {
              message = 'Validasi input gagal';
              details = resObj.message;
            }
          } else if (status === HttpStatus.UNAUTHORIZED) {
            code = 'UNAUTHORIZED';
          } else if (status === HttpStatus.FORBIDDEN) {
            code = 'FORBIDDEN';
          } else if (status === HttpStatus.NOT_FOUND) {
            code = 'NOT_FOUND';
          } else if (status === HttpStatus.CONFLICT) {
            code = 'CONFLICT';
          }
        }
      }
    } else {
      // Jika error berupa object Error native
      if (exception instanceof Error) {
        message = exception.message;
        // Detail stack trace hanya disertakan di non-production
        if (process.env.NODE_ENV !== 'production') {
          details = exception.stack;
        }
      }
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    });
  }
}
