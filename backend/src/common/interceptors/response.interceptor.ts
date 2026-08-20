import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  data: T;
  meta?: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map((data) => {
        // Jika response manual atau header sudah dikirim (misal redirect)
        if (response.headersSent) {
          return data;
        }

        // Jika data sudah dalam format success envelope
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Jika data memiliki format paginasi (data & meta)
        if (data && typeof data === 'object' && 'data' in data && ('meta' in data || 'pagination' in data)) {
          return {
            success: true,
            data: data.data,
            meta: data.meta || data.pagination,
          };
        }

        return {
          success: true,
          data: data === undefined ? null : data,
        };
      }),
    );
  }
}
