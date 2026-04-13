import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
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
