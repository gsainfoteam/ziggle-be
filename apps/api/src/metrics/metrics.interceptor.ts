import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
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

    let statusCode: string | null = null;

    return next.handle().pipe(
      tap({
        error: (err: unknown) => {
          const rawStatusCode = res.statusCode;
          statusCode = String(rawStatusCode ?? 500);

          const errorName =
            err && typeof err === 'object' && 'constructor' in err
              ? (err as { constructor?: { name?: string } }).constructor
                  ?.name ?? 'UnknownError'
              : 'UnknownError';

          httpRequestErrorsTotal.inc({
            method,
            route,
            error_name: errorName,
            status_code: statusCode,
          });
        },
      }),
      finalize(() => {
        const finalStatusCode =
          statusCode === null ? String(res.statusCode ?? 500) : statusCode;

        httpRequestsTotal.inc({
          method,
          route,
          status_code: finalStatusCode,
        });

        endTimer({
          method,
          route,
          status_code: finalStatusCode,
        });

        httpRequestsInFlight.dec({ method, route });
      }),
    );
  }

  private normalizeRoute(req: any): string {
    const baseUrl = req.baseUrl || '';
    const routePath = req.route?.path || '';

    if (routePath) {
      return `${baseUrl}${routePath}`;
    }

    return 'unmatched';
  }
}
