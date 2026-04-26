import type { DashboardTrendPoint } from "@/features/dashboard/contracts";

export interface TrendsChartBar {
  readonly month: string;
  readonly label: string;
  readonly income: number;
  readonly expenses: number;
  readonly balance: number;
  readonly incomeWidth: number;
  readonly expensesWidth: number;
}

export interface TrendsChartProjection {
  readonly bars: readonly TrendsChartBar[];
  readonly maxAmount: number;
  readonly netBalance: number;
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
});

const formatLabel = (month: string): string => {
  const date = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return month;
  }
  return monthFormatter.format(date).replace(/\.$/, "");
};

const computeWidth = (value: number, max: number): number => {
  if (max <= 0) {
    return 0;
  }
  return Math.round(Math.min(value / max, 1) * 100);
};

/**
 * Pure projection that turns a `DashboardTrends.series` payload into
 * UI-ready bars with width % normalized against the period max.
 *
 * Class-based for the same reason as the other dashboard projections:
 * the screen stays declarative, the math stays testable.
 */
export class TrendsChartProjector {
  // eslint-disable-next-line class-methods-use-this
  project(series: readonly DashboardTrendPoint[]): TrendsChartProjection {
    if (series.length === 0) {
      return { bars: [], maxAmount: 0, netBalance: 0 };
    }

    const maxAmount = series.reduce(
      (acc, point) => Math.max(acc, point.income, point.expenses),
      0,
    );

    const bars = series.map<TrendsChartBar>((point) => ({
      month: point.month,
      label: formatLabel(point.month),
      income: point.income,
      expenses: point.expenses,
      balance: point.balance,
      incomeWidth: computeWidth(point.income, maxAmount),
      expensesWidth: computeWidth(point.expenses, maxAmount),
    }));

    const netBalance = series.reduce((acc, point) => acc + point.balance, 0);
    return { bars, maxAmount, netBalance };
  }
}

export const trendsChartProjector = new TrendsChartProjector();
