import { useEffect, useMemo, useState } from "react";

import {
  useDashboardOverviewQuery,
  useDashboardTrendsQuery,
} from "@/features/dashboard/hooks/use-dashboard-overview-query";
import {
  DEFAULT_FOCUS_METRIC_ID,
  FOCUS_METRIC_IDS,
  type FocusMetric,
  type FocusMetricId,
} from "@/features/focus/contracts";
import {
  focusMetricCalculator,
  type FocusMetricCalculator,
} from "@/features/focus/services/focus-metric-calculator";
import {
  loadPersistedFocusMetricId,
  persistFocusMetricId,
} from "@/features/focus/services/focus-storage";

const buildMonthFilter = (): { readonly month: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return { month: `${year}-${month}` };
};

export interface FocusScreenController {
  readonly overviewQuery: ReturnType<typeof useDashboardOverviewQuery>;
  readonly trendsQuery: ReturnType<typeof useDashboardTrendsQuery>;
  readonly metricIds: readonly FocusMetricId[];
  readonly selectedMetricId: FocusMetricId;
  readonly metric: FocusMetric;
  readonly handleSelectMetric: (metricId: FocusMetricId) => void;
}

export interface FocusScreenControllerOptions {
  readonly calculator?: FocusMetricCalculator;
}

export function useFocusScreenController(
  options: FocusScreenControllerOptions = {},
): FocusScreenController {
  const calculator = options.calculator ?? focusMetricCalculator;
  const filters = useMemo(buildMonthFilter, []);
  const overviewQuery = useDashboardOverviewQuery(filters);
  const trendsQuery = useDashboardTrendsQuery(6);
  const [selectedMetricId, setSelectedMetricId] = useState<FocusMetricId>(
    DEFAULT_FOCUS_METRIC_ID,
  );

  useEffect(() => {
    let cancelled = false;
    void loadPersistedFocusMetricId().then((stored) => {
      if (!cancelled) {
        setSelectedMetricId(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const metric = useMemo(
    () =>
      calculator.build(selectedMetricId, {
        overview: overviewQuery.data ?? null,
        trends: trendsQuery.data ?? null,
      }),
    [calculator, selectedMetricId, overviewQuery.data, trendsQuery.data],
  );

  return {
    overviewQuery,
    trendsQuery,
    metricIds: FOCUS_METRIC_IDS,
    selectedMetricId,
    metric,
    handleSelectMetric: (metricId) => {
      setSelectedMetricId(metricId);
      void persistFocusMetricId(metricId);
    },
  };
}
