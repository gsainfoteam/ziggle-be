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

const startPromise = Promise.resolve(sdk.start());

let shutdownPromise: Promise<void> | null = null;

export const initializeOpenTelemetry = async (): Promise<void> => {
  await startPromise;
};

export const shutdownOpenTelemetry = async (): Promise<void> => {
  await initializeOpenTelemetry();

  if (!shutdownPromise) {
    shutdownPromise = sdk.shutdown().catch((error: unknown) => {
      console.error('[otel] failed to shutdown sdk', error);
      throw error;
    });
  }

  await shutdownPromise;
};
