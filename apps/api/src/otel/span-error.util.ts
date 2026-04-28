import { Span, SpanStatusCode } from '@opentelemetry/api';

export const setSpanError = (span: Span, error: unknown): void => {
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
