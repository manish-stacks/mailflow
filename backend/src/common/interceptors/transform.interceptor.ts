import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

/** Uniform envelope: { success, data, meta } — skipped for raw responses (tracking pixels, redirects). */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((body) => {
        if (body && typeof body === 'object' && '__raw' in body) return (body as any).__raw;
        if (body && typeof body === 'object' && 'data' in body && 'meta' in body) {
          return { success: true, ...body };
        }
        return { success: true, data: body ?? null };
      }),
    );
  }
}
