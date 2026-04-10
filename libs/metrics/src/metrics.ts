import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from 'prom-client';

export const metricsRegistry = new Registry();

collectDefaultMetrics({
  register: metricsRegistry,
});

// HTTP
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.03, 0.05, 0.1, 0.3, 0.5, 1, 3, 5, 10],
  registers: [metricsRegistry],
});

export const httpRequestsInFlight = new Gauge({
  name: 'http_requests_in_flight',
  help: 'Current number of in-flight HTTP requests',
  labelNames: ['method', 'route'],
  registers: [metricsRegistry],
});

export const httpRequestErrorsTotal = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of failed HTTP requests',
  labelNames: ['method', 'route', 'error_name', 'status_code'],
  registers: [metricsRegistry],
});

// DB
export const dbQueryDurationSeconds = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'model', 'success'],
  buckets: [0.001, 0.005, 0.01, 0.03, 0.05, 0.1, 0.3, 1, 3, 5, 10],
  registers: [metricsRegistry],
});

export const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model', 'success'],
  registers: [metricsRegistry],
});
