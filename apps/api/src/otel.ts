import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { IncomingMessage, RequestOptions } from 'node:http';

const NOISE_PATHS = ['/health', '/metrics'] as const;

function normalizePath(path?: string): string | undefined {
  if (!path) {
    return undefined;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsedUrl = new URL(path);
      return `${parsedUrl.pathname}${parsedUrl.search}`;
    } catch {
      return path;
    }
  }

  return path;
}

function extractOutgoingPath(request: unknown): string | undefined {
  if (typeof request === 'string') {
    return request;
  }

  if (request instanceof URL) {
    return `${request.pathname}${request.search}`;
  }

  if (!request || typeof request !== 'object') {
    return undefined;
  }

  const options = request as RequestOptions;

  if (typeof options.path === 'string') {
    return options.path;
  }

  const optionsWithExtras = options as RequestOptions & {
    pathname?: unknown;
    href?: unknown;
  };

  if (typeof optionsWithExtras.pathname === 'string') {
    return optionsWithExtras.pathname;
  }

  if (typeof optionsWithExtras.href === 'string') {
    return optionsWithExtras.href;
  }

  return undefined;
}

function isNoisePath(path?: string): boolean {
  const normalizedPath = normalizePath(path);

  if (!normalizedPath) {
    return false;
  }

  return NOISE_PATHS.some((noisePath) => {
    return (
      normalizedPath === noisePath ||
      normalizedPath === `${noisePath}/` ||
      normalizedPath.startsWith(`${noisePath}?`)
    );
  });
}

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (req: IncomingMessage) => {
          return isNoisePath(req.url);
        },
        ignoreOutgoingRequestHook: (request: unknown) => {
          return isNoisePath(extractOutgoingPath(request));
        },
      },
    }),
  ],
});

let startPromise: Promise<void> | null = null;

let shutdownPromise: Promise<void> | null = null;

export const initializeOpenTelemetry = async (): Promise<void> => {
  if (!startPromise) {
    startPromise = Promise.resolve(sdk.start()).catch((error: unknown) => {
      startPromise = null;
      throw error;
    });
  }

  await startPromise;
};

export const shutdownOpenTelemetry = async (): Promise<void> => {
  await initializeOpenTelemetry();

  if (!shutdownPromise) {
    let timeout: NodeJS.Timeout | null = null;

    shutdownPromise = Promise.race([
      sdk.shutdown(),
      new Promise<void>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`[otel] shutdown timeout after 10,000ms`));
        }, 10000);
      }),
    ])
      .catch((error: unknown) => {
        shutdownPromise = null;
        console.error('[otel] failed to shutdown sdk', error);
        throw error;
      })
      .finally(() => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
  }

  await shutdownPromise;
};
