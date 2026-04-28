import { SpanStatusCode, context, trace } from '@opentelemetry/api';
import { Observable, isObservable } from 'rxjs';
import { setSpanError } from './span-error.util';

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
    const parentContext = context.active();
    return methodTracer.startActiveSpan(spanName, {}, parentContext, (span) => {
      try {
        const result = originalMethod.apply(this, args);
        if (isObservable(result)) {
          const returnedAtNs = process.hrtime.bigint();
          span.updateName(`${spanName}.invocation`);
          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          return wrapObservableWithSpan(
            result as Observable<unknown>,
            spanName,
            returnedAtNs,
            parentContext,
          );
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
  spanName: string,
  returnedAtNs: bigint,
  parentContext: ReturnType<typeof context.active>,
): Observable<unknown> =>
  new Observable<unknown>((subscriber) => {
    const subscribedAtNs = process.hrtime.bigint();
    const subscriptionGapMs = Number(subscribedAtNs - returnedAtNs) / 1_000_000;
    const pipelineSpan = context.with(parentContext, () =>
      methodTracer.startSpan(`${spanName}.pipeline`),
    );
    pipelineSpan.setAttribute('subscription_gap_ms', subscriptionGapMs);
    const pipelineContext = trace.setSpan(parentContext, pipelineSpan);
    const executionSpan = context.with(pipelineContext, () =>
      methodTracer.startSpan(`${spanName}.execution`),
    );
    const executionContext = trace.setSpan(pipelineContext, executionSpan);
    const withExecutionContext = <T>(callback: () => T): T =>
      context.with(executionContext, callback);

    let spansEnded = false;
    const endSpans = (): void => {
      if (!spansEnded) {
        spansEnded = true;
        executionSpan.end();
        pipelineSpan.end();
      }
    };

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      subscription = withExecutionContext(() =>
        source$.subscribe({
          next: (value) => {
            withExecutionContext(() => {
              subscriber.next(value);
            });
          },
          error: (error: unknown) => {
            withExecutionContext(() => {
              setSpanError(executionSpan, error);
              setSpanError(pipelineSpan, error);
              endSpans();
              subscriber.error(error);
            });
          },
          complete: () => {
            withExecutionContext(() => {
              executionSpan.setStatus({ code: SpanStatusCode.OK });
              pipelineSpan.setStatus({ code: SpanStatusCode.OK });
              endSpans();
              subscriber.complete();
            });
          },
        }),
      );
    } catch (error: unknown) {
      withExecutionContext(() => {
        setSpanError(executionSpan, error);
        setSpanError(pipelineSpan, error);
        endSpans();
        subscriber.error(error);
      });
    }

    return () => {
      try {
        withExecutionContext(() => {
          subscription?.unsubscribe();
        });
      } finally {
        endSpans();
      }
    };
  });

const isPromiseLike = (value: unknown): value is Promise<unknown> => {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return false;
  }
  return typeof (value as Promise<unknown>).then === 'function';
};

