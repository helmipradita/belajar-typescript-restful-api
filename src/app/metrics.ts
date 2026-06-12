import client from "prom-client";

client.collectDefaultMetrics();

export const metricsRegistry = client.register;

export const httpRequestTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests processed.",
    labelNames: ["method", "route", "status"] as const
});

export const httpRequestDurationSeconds = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request latency in seconds.",
    labelNames: ["method", "route", "status"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});
