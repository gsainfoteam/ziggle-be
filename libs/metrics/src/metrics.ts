import { metrics, type Attributes } from '@opentelemetry/api';

type CounterAdapter = {
  add(value: number, attributes?: Attributes): void;
};

type HistogramAdapter = {
  record(value: number, attributes?: Attributes): void;
};

type UpDownCounterAdapter = {
  add(value: number, attributes?: Attributes): void;
};

type Instruments = {
  httpRequestsTotal: CounterAdapter;
  httpRequestDurationSeconds: HistogramAdapter;
  httpRequestsInFlight: UpDownCounterAdapter;
  httpRequestErrorsTotal: CounterAdapter;
  dbQueryDurationSeconds: HistogramAdapter;
  dbQueriesTotal: CounterAdapter;
};

const METRIC_DEFINITIONS = {
  // HTTP
  httpRequestsTotal: {
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  },
  httpRequestDurationSeconds: {
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.03, 0.05, 0.1, 0.3, 0.5, 1, 3, 5, 10],
  },
  httpRequestsInFlight: {
    name: 'http_requests_in_flight',
    help: 'Current number of in-flight HTTP requests',
    labelNames: ['method', 'route'],
  },
  httpRequestErrorsTotal: {
    name: 'http_request_errors_total',
    help: 'Total number of failed HTTP requests',
    labelNames: ['method', 'route', 'error_name', 'status_code'],
  },
  // DB
  dbQueryDurationSeconds: {
    name: 'db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'model'],
    buckets: [0.001, 0.005, 0.01, 0.03, 0.05, 0.1, 0.3, 1, 3, 5, 10],
  },
  dbQueriesTotal: {
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'model'],
  },
} as const;

let instruments: Instruments | null = null;

const getInstruments = (): Instruments => {
  if (instruments) {
    return instruments;
  }

  const meter = metrics.getMeter(process.env.OTEL_SERVICE_NAME ?? 'Unknown');

  instruments = {
    httpRequestsTotal: meter.createCounter(
      METRIC_DEFINITIONS.httpRequestsTotal.name,
      {
        description: METRIC_DEFINITIONS.httpRequestsTotal.help,
      },
    ),
    httpRequestDurationSeconds: meter.createHistogram(
      METRIC_DEFINITIONS.httpRequestDurationSeconds.name,
      {
        description: METRIC_DEFINITIONS.httpRequestDurationSeconds.help,
        unit: 's',
        advice: {
          explicitBucketBoundaries: [
            ...METRIC_DEFINITIONS.httpRequestDurationSeconds.buckets,
          ],
        },
      },
    ),
    httpRequestsInFlight: meter.createUpDownCounter(
      METRIC_DEFINITIONS.httpRequestsInFlight.name,
      {
        description: METRIC_DEFINITIONS.httpRequestsInFlight.help,
      },
    ),
    httpRequestErrorsTotal: meter.createCounter(
      METRIC_DEFINITIONS.httpRequestErrorsTotal.name,
      {
        description: METRIC_DEFINITIONS.httpRequestErrorsTotal.help,
      },
    ),
    dbQueryDurationSeconds: meter.createHistogram(
      METRIC_DEFINITIONS.dbQueryDurationSeconds.name,
      {
        description: METRIC_DEFINITIONS.dbQueryDurationSeconds.help,
        unit: 's',
        advice: {
          explicitBucketBoundaries: [
            ...METRIC_DEFINITIONS.dbQueryDurationSeconds.buckets,
          ],
        },
      },
    ),
    dbQueriesTotal: meter.createCounter(
      METRIC_DEFINITIONS.dbQueriesTotal.name,
      {
        description: METRIC_DEFINITIONS.dbQueriesTotal.help,
      },
    ),
  };

  return instruments;
};

// HTTP
export const httpRequestsTotal: CounterAdapter = {
  add(value, attributes) {
    getInstruments().httpRequestsTotal.add(value, attributes);
  },
};

export const httpRequestDurationSeconds: HistogramAdapter = {
  record(value, attributes) {
    getInstruments().httpRequestDurationSeconds.record(value, attributes);
  },
};

export const startHttpRequestDurationTimer = (labels: Attributes) => {
  const start = process.hrtime.bigint();

  return (extraLabels: Attributes = {}) => {
    const end = process.hrtime.bigint();
    const durationSeconds = Number(end - start) / 1_000_000_000;

    httpRequestDurationSeconds.record(durationSeconds, {
      ...labels,
      ...extraLabels,
    });
  };
};

export const httpRequestsInFlight: UpDownCounterAdapter = {
  add(value, attributes) {
    getInstruments().httpRequestsInFlight.add(value, attributes);
  },
};

export const httpRequestErrorsTotal: CounterAdapter = {
  add(value, attributes) {
    getInstruments().httpRequestErrorsTotal.add(value, attributes);
  },
};

// DB
export const dbQueryDurationSeconds: HistogramAdapter = {
  record(value, attributes) {
    getInstruments().dbQueryDurationSeconds.record(value, attributes);
  },
};

export const dbQueriesTotal: CounterAdapter = {
  add(value, attributes) {
    getInstruments().dbQueriesTotal.add(value, attributes);
  },
};
