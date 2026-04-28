import type { DashboardTrendPoint } from "@/features/dashboard/contracts";

export type ComparisonDirection = "up" | "down" | "flat";

export interface PeriodComparison {
  /** Selected month, snapshotted from the trend point. */
  readonly current: DashboardTrendPoint | null;
  /** Period immediately before `current` in the same series. */
  readonly previous: DashboardTrendPoint | null;
  /** Absolute delta (current - previous) per axis. Null when no baseline. */
  readonly delta: {
    readonly income: number;
    readonly expenses: number;
    readonly balance: number;
  } | null;
  /**
   * Percentage change per axis with sane handling for divide-by-zero
   * (returns Infinity * sign(delta) when previous is 0 and delta != 0).
   * Null when no baseline.
   */
  readonly percent: {
    readonly income: number;
    readonly expenses: number;
    readonly balance: number;
  } | null;
}

const safeRatio = (current: number, previous: number): number => {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }
    return current > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }
  return (current - previous) / Math.abs(previous);
};

/**
 * Resolves the comparison snapshot for the selected month against the
 * immediately preceding entry in the trends series. Returns nulls when
 * the baseline is missing so call sites can fall back to a neutral
 * UI without branching on series shape.
 *
 * @param series Trend series ordered by month ascending.
 * @param selectedMonth Target month in `YYYY-MM` format.
 */
export const buildPeriodComparison = (
  series: readonly DashboardTrendPoint[],
  selectedMonth: string,
): PeriodComparison => {
  const sorted = [...series].sort((a, b) => a.month.localeCompare(b.month));
  const index = sorted.findIndex((point) => point.month === selectedMonth);
  if (index === -1) {
    return { current: null, previous: null, delta: null, percent: null };
  }

  const current = sorted[index];
  const previous = index > 0 ? sorted[index - 1] : null;

  if (!current || !previous) {
    return { current: current ?? null, previous: null, delta: null, percent: null };
  }

  return {
    current,
    previous,
    delta: {
      income: current.income - previous.income,
      expenses: current.expenses - previous.expenses,
      balance: current.balance - previous.balance,
    },
    percent: {
      income: safeRatio(current.income, previous.income),
      expenses: safeRatio(current.expenses, previous.expenses),
      balance: safeRatio(current.balance, previous.balance),
    },
  };
};

/**
 * Resolves the visual direction (up / down / flat) for a delta against
 * an "is positive good" semantic. For income/balance, up = good (green).
 * For expenses, up = bad (red) — the caller controls the colour by
 * inverting `positiveGood`.
 *
 * @param delta Numeric delta, may be ±Infinity.
 * @returns `flat` when delta is 0 (or both sides were 0).
 */
export const resolveComparisonDirection = (delta: number): ComparisonDirection => {
  if (!Number.isFinite(delta)) {
    return delta > 0 ? "up" : "down";
  }
  if (delta > 0) {
    return "up";
  }
  if (delta < 0) {
    return "down";
  }
  return "flat";
};
