import { Span, SpanStatusCode, context, trace } from '@opentelemetry/api';
import { Observable, isObservable } from 'rxjs';

const WRAPPED = Symbol('OTEL_SERVICE_TRACE_WRAPPED');
type AnyMethod = ((...args: unknown[]) => unknown) & { [WRAPPED]?: true };

export const Trace = (): ClassDecorator => {
  return (target: Function) => {
    const className = target.name || 'UnknownClass';
    const prototype = target.prototype as Record<string, unknown>;
    if (!prototype) {
      return;
    }

    for (const methodName of Object.getOwnPropertyNames(prototype)) {
      if (methodName === 'constructor') {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
      if (!descriptor || typeof descriptor.value !== 'function') {
        continue;
      }

      const wrapped = wrapMethod(
        descriptor.value as AnyMethod,
        `${className}.${methodName}`,
      );
      if (wrapped === descriptor.value) {
        continue;
      }

      Object.defineProperty(prototype, methodName, {
        ...descriptor,
        value: wrapped,
      });
    }
  };
};

const methodTracer = trace.getTracer('ziggle.method.tracing');

const wrapMethod = (originalMethod: AnyMethod, spanName: string): AnyMethod => {
  if (originalMethod[WRAPPED]) {
    return originalMethod;
  }

  const wrapped: AnyMethod = function (...args: unknown[]): unknown {
    return methodTracer.startActiveSpan(spanName, (span) => {
      try {
        const result = originalMethod.apply(this, args);
        if (isObservable(result)) {
          return wrapObservableWithSpan(result as Observable<unknown>, span);
        }

        if (isPromiseLike(result)) {
          return Promise.resolve(result)
            .then((value) => {
              span.setStatus({ code: SpanStatusCode.OK });
              return value;
            })
            .catch((error: unknown) => {
              setSpanError(span, error);
              throw error;
            })
            .finally(() => {
              span.end();
            });
        }

        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      } catch (error: unknown) {
        setSpanError(span, error);
        span.end();
        throw error;
      }
    });
  };

  wrapped[WRAPPED] = true;
  return wrapped;
};

const wrapObservableWithSpan = (
  source$: Observable<unknown>,
  span: Span,
): Observable<unknown> =>
  new Observable<unknown>((subscriber) =>
    {
      const spanContext = trace.setSpan(context.active(), span);
      const withSpanContext = <T>(callback: () => T): T =>
        context.with(spanContext, callback);

      let spanEnded = false;
      const endSpan = (): void => {
        if (!spanEnded) {
          spanEnded = true;
          span.end();
        }
      };

      let subscription: { unsubscribe: () => void } | undefined;
      try {
        subscription = withSpanContext(() =>
          source$.subscribe({
            next: (value) => {
              withSpanContext(() => {
                subscriber.next(value);
              });
            },
            error: (error: unknown) => {
              withSpanContext(() => {
                setSpanError(span, error);
                endSpan();
                subscriber.error(error);
              });
            },
            complete: () => {
              withSpanContext(() => {
                span.setStatus({ code: SpanStatusCode.OK });
                endSpan();
                subscriber.complete();
              });
            },
          }),
        );
      } catch (error: unknown) {
        withSpanContext(() => {
          setSpanError(span, error);
          endSpan();
          subscriber.error(error);
        });
      }

      return () => {
        endSpan();
        subscription?.unsubscribe();
      };
    },
  );

const isPromiseLike = (value: unknown): value is Promise<unknown> => {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return false;
  }
  return typeof (value as Promise<unknown>).then === 'function';
};

const setSpanError = (span: Span, error: unknown): void => {
  if (error instanceof Error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    return;
  }

  span.recordException({
    name: 'UnknownError',
    message: String(error),
  });
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: String(error),
  });
};
