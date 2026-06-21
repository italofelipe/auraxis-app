import type {
  InsightCadence,
  InsightSeries,
} from "@/features/insights/fluida/contracts";
import { fillRatio, maxValue } from "@/shared/utils/chart-geometry";

/**
 * X-axis labels for the "ritmo de saídas" chart, one set per cadence. Daily
 * labels are day-of-month numbers (14–20 jun); weekly labels count back from
 * "Atual" (the current week). Lengths must match the corresponding
 * {@link InsightSeries} arrays (7 daily / 6 weekly).
 */
export const SERIES_LABELS: Record<InsightCadence, readonly string[]> = {
  daily: ["14", "15", "16", "17", "18", "19", "20"],
  weekly: ["S-5", "S-4", "S-3", "S-2", "S-1", "Atual"],
};

/**
 * Index of the largest finite value in a series — the bar the chart
 * highlights as the peak. Non-finite entries are ignored. Ties resolve to the
 * first occurrence. Returns -1 for an empty series so callers can skip the
 * peak treatment entirely.
 *
 * @param values Series values.
 * @returns Index of the peak, or -1 when there is nothing to plot.
 */
export const peakIndex = (values: readonly number[]): number => {
  let best = -1;
  let bestValue = Number.NEGATIVE_INFINITY;
  values.forEach((value, index) => {
    if (Number.isFinite(value) && value > bestValue) {
      bestValue = value;
      best = index;
    }
  });
  return best;
};

/**
 * Picks the series values matching the active cadence.
 *
 * @param series Daily + weekly outflow series.
 * @param cadence Active reading cadence.
 * @returns The 7 daily or 6 weekly values.
 */
export const selectSeriesValues = (
  series: InsightSeries,
  cadence: InsightCadence,
): readonly number[] => {
  return cadence === "weekly" ? series.weekly : series.daily;
};

/** A single bar of the rhythm chart, ready to render. */
export interface ChartBar {
  /** X-axis label below the bar. */
  readonly label: string;
  /** Raw BRL outflow for this bucket. */
  readonly value: number;
  /** Height fraction relative to the peak, in `[0, 1]`. */
  readonly ratio: number;
  /** Whether this bar is the highlighted peak. */
  readonly isPeak: boolean;
}

/**
 * Builds the chart bars for a cadence: one {@link ChartBar} per series value,
 * each with its label, height ratio (relative to the peak) and a `isPeak`
 * flag. When every value is zero no bar is flagged and all ratios are 0, so a
 * flat series renders as an empty track rather than an arbitrary highlight.
 *
 * @param series Daily + weekly outflow series.
 * @param cadence Active reading cadence.
 * @returns The bars to plot, left-to-right (chronological).
 */
export const buildChartBars = (
  series: InsightSeries,
  cadence: InsightCadence,
): readonly ChartBar[] => {
  const values = selectSeriesValues(series, cadence);
  const labels = SERIES_LABELS[cadence];
  const max = maxValue(values);
  const peak = max > 0 ? peakIndex(values) : -1;

  return values.map((value, index) => ({
    label: labels[index],
    value,
    ratio: fillRatio(value, max),
    isPeak: index === peak,
  }));
};
