import type { ObservabilitySnapshot } from "@/features/observability/contracts";

export const observabilitySnapshotFixture: ObservabilitySnapshot = {
  generatedAt: "2026-04-07T12:00:00+00:00",
  metrics: {
    httpRequestsTotal: 1240,
    graphqlRequestsTotal: 312,
    authFailuresTotal: 18,
  },
  budgets: {
    p95ResponseMs: 148,
    p99ResponseMs: 244,
    errorRate: 0.003,
  },
  health: {
    api: "ok",
    database: "ok",
    cache: "ok",
  },
};

export const prometheusMetricsFixture = [
  "# HELP auraxis_http_requests_total Total de requests HTTP.",
  "# TYPE auraxis_http_requests_total counter",
  "auraxis_http_requests_total{route=\"/healthz\",status=\"200\"} 1240",
].join("\n");
