import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  httpRequestDurationSeconds,
  httpRequestErrorsTotal,
  httpRequestsInFlight,
  httpRequestsTotal,
} from '@lib/metrics';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const method = req.method ?? 'UNKNOWN';
    const route = this.normalizeRoute(req);

    if (route === '/metrics') {
      return next.handle();
    }

    const endTimer = httpRequestDurationSeconds.startTimer({
      method,
      route,
    } as Record<string, string>);

    httpRequestsInFlight.inc({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = String(res.statusCode ?? 200);

          httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });

          endTimer({
            method,
            route,
            status_code: statusCode,
          });

          httpRequestsInFlight.dec({ method, route });
        },
        error: (err: unknown) => {
          const rawStatusCode = res.statusCode;
          const statusCode = String(
            !rawStatusCode || rawStatusCode < 400 ? 500 : rawStatusCode,
          );
          const errorName =
            err && typeof err === 'object' && 'constructor' in err
              ? (err as { constructor?: { name?: string } }).constructor
                  ?.name ?? 'UnknownError'
              : 'UnknownError';

          httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });

          httpRequestErrorsTotal.inc({
            method,
            route,
            error_name: errorName,
            status_code: statusCode,
          });

          endTimer({
            method,
            route,
            status_code: statusCode,
          });

          httpRequestsInFlight.dec({ method, route });
        },
      }),
    );
  }

  private normalizeRoute(req: any): string {
    const baseUrl = req.baseUrl || '';
    const routePath = req.route?.path || '';

    if (routePath) {
      return `${baseUrl}${routePath}`;
    }

    return req.path || req.originalUrl?.split('?')[0] || 'unknown';
  }
}
