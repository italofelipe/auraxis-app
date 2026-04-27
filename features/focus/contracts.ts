export const FOCUS_METRIC_IDS = [
  "monthlyBurnRate",
  "freeBalanceAfterFixed",
  "savingsVsPreviousMonth",
  "monthlyExpenses",
  "monthlyIncome",
] as const;

export type FocusMetricId = (typeof FOCUS_METRIC_IDS)[number];

export type FocusMetricUnit = "currency" | "percent";

export type FocusMetricTrendDirection = "up" | "down" | "flat";

export interface FocusMetricTrend {
  readonly delta: number;
  readonly percent: number | null;
  readonly direction: FocusMetricTrendDirection;
}

export interface FocusMetric {
  readonly id: FocusMetricId;
  readonly value: number;
  readonly unit: FocusMetricUnit;
  readonly label: string;
  readonly caption?: string;
  readonly trend: FocusMetricTrend | null;
  readonly unavailable: boolean;
}

export const FOCUS_SELECTED_METRIC_STORAGE_KEY =
  "auraxis:focus:selected-metric";

export const DEFAULT_FOCUS_METRIC_ID: FocusMetricId = "freeBalanceAfterFixed";
