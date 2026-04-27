import type { DashboardOverview, DashboardTrends } from "@/features/dashboard/contracts";
import type {
  FocusMetric,
  FocusMetricId,
  FocusMetricTrend,
} from "@/features/focus/contracts";

export interface FocusMetricInput {
  readonly overview: DashboardOverview | null;
  readonly trends: DashboardTrends | null;
}

const resolveDirection = (signed: number): FocusMetricTrend["direction"] => {
  if (signed > 0) {
    return "up";
  }
  if (signed < 0) {
    return "down";
  }
  return "flat";
};

const buildTrend = (
  current: number,
  previous: number | null,
): FocusMetricTrend | null => {
  if (previous === null || !Number.isFinite(previous) || previous === 0) {
    return null;
  }
  const delta = current - previous;
  const percent = (delta / Math.abs(previous)) * 100;
  return {
    delta,
    percent: Number.isFinite(percent) ? Number(percent.toFixed(2)) : null,
    direction: resolveDirection(delta),
  };
};

const previousMonthBalance = (trends: DashboardTrends | null): number | null => {
  if (!trends || trends.series.length < 2) {
    return null;
  }
  const previous = trends.series[trends.series.length - 2];
  return previous?.balance ?? null;
};

const previousMonthExpenses = (
  trends: DashboardTrends | null,
): number | null => {
  if (!trends || trends.series.length < 2) {
    return null;
  }
  const previous = trends.series[trends.series.length - 2];
  return previous?.expenses ?? null;
};

const buildMonthlyBurnRate = (input: FocusMetricInput): FocusMetric => {
  const expense = input.overview?.totals.expenseTotal ?? 0;
  return {
    id: "monthlyBurnRate",
    value: expense,
    unit: "currency",
    label: "Gasto mensal",
    caption: "Quanto saiu da conta este mes.",
    trend: buildTrend(expense, previousMonthExpenses(input.trends)),
    unavailable: input.overview === null,
  };
};

const buildFreeBalanceAfterFixed = (input: FocusMetricInput): FocusMetric => {
  const balance = input.overview?.totals.balance ?? 0;
  return {
    id: "freeBalanceAfterFixed",
    value: balance,
    unit: "currency",
    label: "Saldo livre",
    caption: "Receitas - despesas no mes corrente.",
    trend: buildTrend(balance, previousMonthBalance(input.trends)),
    unavailable: input.overview === null,
  };
};

const buildSavingsVsPreviousMonth = (input: FocusMetricInput): FocusMetric => {
  const currentBalance = input.overview?.totals.balance ?? 0;
  const previous = previousMonthBalance(input.trends);
  if (previous === null) {
    return {
      id: "savingsVsPreviousMonth",
      value: 0,
      unit: "percent",
      label: "Variacao vs mes anterior",
      caption: "Sem mes anterior para comparar.",
      trend: null,
      unavailable: true,
    };
  }
  const delta = currentBalance - previous;
  const percent =
    previous === 0 ? 0 : (delta / Math.abs(previous)) * 100;
  return {
    id: "savingsVsPreviousMonth",
    value: Number.isFinite(percent) ? Number(percent.toFixed(2)) : 0,
    unit: "percent",
    label: "Variacao vs mes anterior",
    caption: "Quanto seu saldo cresceu em relacao ao mes anterior.",
    trend: {
      delta,
      percent: Number.isFinite(percent) ? Number(percent.toFixed(2)) : null,
      direction: resolveDirection(delta),
    },
    unavailable: false,
  };
};

const buildMonthlyExpenses = (input: FocusMetricInput): FocusMetric => {
  const expense = input.overview?.totals.expenseTotal ?? 0;
  return {
    id: "monthlyExpenses",
    value: expense,
    unit: "currency",
    label: "Despesas do mes",
    caption: "Total de despesas no mes corrente.",
    trend: buildTrend(expense, previousMonthExpenses(input.trends)),
    unavailable: input.overview === null,
  };
};

const buildMonthlyIncome = (input: FocusMetricInput): FocusMetric => {
  const income = input.overview?.totals.incomeTotal ?? 0;
  return {
    id: "monthlyIncome",
    value: income,
    unit: "currency",
    label: "Receitas do mes",
    caption: "Total de receitas registradas neste mes.",
    trend: null,
    unavailable: input.overview === null,
  };
};

export class FocusMetricCalculator {
  // eslint-disable-next-line class-methods-use-this
  build(metricId: FocusMetricId, input: FocusMetricInput): FocusMetric {
    switch (metricId) {
      case "monthlyBurnRate":
        return buildMonthlyBurnRate(input);
      case "freeBalanceAfterFixed":
        return buildFreeBalanceAfterFixed(input);
      case "savingsVsPreviousMonth":
        return buildSavingsVsPreviousMonth(input);
      case "monthlyExpenses":
        return buildMonthlyExpenses(input);
      case "monthlyIncome":
        return buildMonthlyIncome(input);
      default:
        return buildFreeBalanceAfterFixed(input);
    }
  }
}

export const focusMetricCalculator = new FocusMetricCalculator();
