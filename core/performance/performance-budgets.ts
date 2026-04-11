export type PerformanceMetricKey =
  | "startup.total"
  | "runtime.revalidation"
  | "runtime.reachability";

export type PerformanceBudgetMap = Record<PerformanceMetricKey, number>;

export const PERFORMANCE_BUDGETS: PerformanceBudgetMap = {
  "startup.total": 2000,
  "runtime.revalidation": 1500,
  "runtime.reachability": 500,
};

/**
 * Returns the canonical performance budget (ms) for a metric.
 */
export const getPerformanceBudget = (
  metric: PerformanceMetricKey,
): number => {
  return PERFORMANCE_BUDGETS[metric];
};
