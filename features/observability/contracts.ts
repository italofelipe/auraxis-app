export interface ObservabilitySnapshot {
  readonly generatedAt: string;
  readonly metrics: Record<string, number>;
  readonly budgets: Record<string, number>;
  readonly health: Record<string, string>;
}

export interface PrometheusMetricsExport {
  readonly payload: string;
}

export type ObservabilityMetricsSnapshot = PrometheusMetricsExport;
