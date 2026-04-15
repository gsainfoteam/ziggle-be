import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import {
  httpRequestErrorsTotal,
  httpRequestsInFlight,
  httpRequestsTotal,
  startHttpRequestDurationTimer,
} from '@lib/metrics';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const method = req.method ?? 'UNKNOWN';
    const route = this.normalizeRoute(req);

    const endTimer = startHttpRequestDurationTimer({ method, route });

    httpRequestsInFlight.add(1, { method, route });

    let statusCode: string | null = null;

    return next.handle().pipe(
      tap({
        error: (err: unknown) => {
          const rawStatusCode = res.statusCode;
          if (err instanceof HttpException) {
            statusCode = String(err.getStatus());
          } else {
            statusCode = String(
              !rawStatusCode || rawStatusCode < 400 ? 500 : rawStatusCode,
            );
          }

          const errorName =
            err && typeof err === 'object' && 'constructor' in err
              ? (err as { constructor?: { name?: string } }).constructor
                  ?.name ?? 'UnknownError'
              : 'UnknownError';

          httpRequestErrorsTotal.add(1, {
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

        httpRequestsTotal.add(1, {
          method,
          route,
          status_code: finalStatusCode,
        });

        endTimer({ status_code: finalStatusCode });

        httpRequestsInFlight.add(-1, { method, route });
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
