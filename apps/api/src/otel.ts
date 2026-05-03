import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { IncomingMessage, RequestOptions } from 'node:http';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const NOISE_PATHS = ['/health', '/metrics'] as const;

const metricsPort = Number(process.env.METRICS_PORT);
const apiUrl = process.env.API_URL;

if (Number.isNaN(metricsPort) && apiUrl?.includes('ziggle.gistory.me')) {
  throw new Error('METRICS_PORT is not set or is not a number');
}

const prometheusExporter = new PrometheusExporter({
  port: metricsPort,
  endpoint: '/metrics',
});

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

  const [pathname] = normalizedPath.split('?');
  const canonicalPath = pathname.replace(/\/+$/, '') || '/';

  return NOISE_PATHS.some((noisePath) => canonicalPath === noisePath);
}

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  }),
  metricReader: prometheusExporter,
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
    new PrismaInstrumentation(),
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
  if (!startPromise) {
    return;
  }

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
