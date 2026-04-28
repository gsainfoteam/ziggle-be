import { ClassSerializerInterceptor, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SpanStatusCode, trace } from '@opentelemetry/api';

type SerializeMethod = ClassSerializerInterceptor['serialize'];
type SerializeArgs = Parameters<SerializeMethod>;
type SerializeResult = ReturnType<SerializeMethod>;

@Injectable()
export class OtelClassSerializerInterceptor extends ClassSerializerInterceptor {
  private readonly tracer = trace.getTracer('class-serializer');

  constructor(reflector: Reflector) {
    super(reflector);
  }

  public override serialize(...args: SerializeArgs): SerializeResult {
    const span = this.tracer.startSpan('nest.response.serialize');
    try {
      const result = super.serialize(...args);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
      } else {
        span.recordException({
          name: 'UnknownError',
          message: String(error),
        });
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: String(error),
        });
      }
      throw error;
    } finally {
      span.end();
    }
  }
}
