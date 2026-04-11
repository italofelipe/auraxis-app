import type { AppDomainLogger } from "@/core/telemetry/domain-loggers";
import { performanceLogger } from "@/core/telemetry/domain-loggers";

import { now as defaultNow } from "@/core/performance/performance-clock";
import {
  PERFORMANCE_BUDGETS,
  type PerformanceBudgetMap,
  type PerformanceMetricKey,
} from "@/core/performance/performance-budgets";

export interface PerformanceMeasurement {
  readonly metric: PerformanceMetricKey;
  readonly durationMs: number;
  readonly budgetMs: number;
  readonly exceeded: boolean;
}

export interface PerformanceTracker {
  start: (metric: PerformanceMetricKey) => void;
  end: (
    metric: PerformanceMetricKey,
    context?: Record<string, unknown>,
  ) => PerformanceMeasurement | null;
  reset: () => void;
}

interface PerformanceTrackerOptions {
  readonly now?: () => number;
  readonly budgets?: PerformanceBudgetMap;
  readonly logger?: AppDomainLogger<"performance">;
  readonly shouldTrack?: () => boolean;
}

const shouldTrackByDefault = (): boolean => {
  if (typeof process !== "undefined" && process.env.JEST_WORKER_ID) {
    return false;
  }

  return true;
};

const buildMeasurementContext = (
  metric: PerformanceMetricKey,
  durationMs: number,
  budgetMs: number,
  exceeded: boolean,
  extraContext?: Record<string, unknown>,
): Record<string, unknown> => {
  const baseContext = {
    metric,
    durationMs,
    budgetMs,
    exceeded,
  };

  return {
    ...(extraContext ?? {}),
    ...baseContext,
  };
};

export const createPerformanceTracker = (
  options: PerformanceTrackerOptions = {},
): PerformanceTracker => {
  const {
    now = defaultNow,
    budgets = PERFORMANCE_BUDGETS,
    logger = performanceLogger,
    shouldTrack = shouldTrackByDefault,
  } = options;

  const activeMeasurements = new Map<PerformanceMetricKey, number>();

  const start = (metric: PerformanceMetricKey): void => {
    activeMeasurements.set(metric, now());
  };

  const end = (
    metric: PerformanceMetricKey,
    context?: Record<string, unknown>,
  ): PerformanceMeasurement | null => {
    const startedAt = activeMeasurements.get(metric);

    if (startedAt === undefined) {
      return null;
    }

    activeMeasurements.delete(metric);

    const durationMs = Math.max(0, now() - startedAt);
    const budgetMs = budgets[metric];
    const exceeded = durationMs > budgetMs;
    const measurementContext = buildMeasurementContext(
      metric,
      durationMs,
      budgetMs,
      exceeded,
      context,
    );

    if (shouldTrack()) {
      logger.log("performance.measurement_recorded", {
        context: measurementContext,
      });

      if (exceeded) {
        logger.log("performance.budget_exceeded", {
          level: "warn",
          context: measurementContext,
        });
      }
    }

    return {
      metric,
      durationMs,
      budgetMs,
      exceeded,
    };
  };

  const reset = (): void => {
    activeMeasurements.clear();
  };

  return {
    start,
    end,
    reset,
  };
};

export const performanceTracker = createPerformanceTracker();

export const resetPerformanceTrackerForTests = (): void => {
  performanceTracker.reset();
};
