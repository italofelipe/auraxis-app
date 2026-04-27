import { focusMetricCalculator } from "@/features/focus/services/focus-metric-calculator";

const buildOverview = (overrides: Partial<{
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
}> = {}) => ({
  month: "2026-04",
  totals: {
    incomeTotal: overrides.incomeTotal ?? 5000,
    expenseTotal: overrides.expenseTotal ?? 3000,
    balance: overrides.balance ?? 2000,
  },
  counts: {
    totalTransactions: 0,
    incomeTransactions: 0,
    expenseTransactions: 0,
    status: {},
  },
  topCategories: { expense: [], income: [] },
});

const buildTrends = (
  series: { month: string; income: number; expenses: number; balance: number }[],
) => ({ months: series.length, series });

describe("focusMetricCalculator", () => {
  it("retorna unavailable quando overview e null", () => {
    const metric = focusMetricCalculator.build("freeBalanceAfterFixed", {
      overview: null,
      trends: null,
    });
    expect(metric.unavailable).toBe(true);
  });

  it("monthlyBurnRate usa expenseTotal", () => {
    const metric = focusMetricCalculator.build("monthlyBurnRate", {
      overview: buildOverview({ expenseTotal: 1500 }),
      trends: null,
    });
    expect(metric.value).toBe(1500);
    expect(metric.unit).toBe("currency");
  });

  it("freeBalanceAfterFixed usa balance", () => {
    const metric = focusMetricCalculator.build("freeBalanceAfterFixed", {
      overview: buildOverview({ balance: 800 }),
      trends: null,
    });
    expect(metric.value).toBe(800);
  });

  it("savingsVsPreviousMonth retorna unavailable sem mes anterior", () => {
    const metric = focusMetricCalculator.build("savingsVsPreviousMonth", {
      overview: buildOverview({ balance: 100 }),
      trends: buildTrends([
        { month: "2026-04", income: 0, expenses: 0, balance: 100 },
      ]),
    });
    expect(metric.unavailable).toBe(true);
  });

  it("savingsVsPreviousMonth calcula percentual de variacao", () => {
    const metric = focusMetricCalculator.build("savingsVsPreviousMonth", {
      overview: buildOverview({ balance: 200 }),
      trends: buildTrends([
        { month: "2026-03", income: 0, expenses: 0, balance: 100 },
        { month: "2026-04", income: 0, expenses: 0, balance: 200 },
      ]),
    });
    expect(metric.value).toBe(100);
    expect(metric.trend?.direction).toBe("up");
  });

  it("monthlyExpenses + monthlyIncome usam totals diretamente", () => {
    const expenses = focusMetricCalculator.build("monthlyExpenses", {
      overview: buildOverview({ expenseTotal: 444 }),
      trends: null,
    });
    const income = focusMetricCalculator.build("monthlyIncome", {
      overview: buildOverview({ incomeTotal: 999 }),
      trends: null,
    });
    expect(expenses.value).toBe(444);
    expect(income.value).toBe(999);
  });

  it("trend reflete down quando saldo cai", () => {
    const metric = focusMetricCalculator.build("freeBalanceAfterFixed", {
      overview: buildOverview({ balance: 50 }),
      trends: buildTrends([
        { month: "2026-03", income: 0, expenses: 0, balance: 100 },
        { month: "2026-04", income: 0, expenses: 0, balance: 50 },
      ]),
    });
    expect(metric.trend?.direction).toBe("down");
    expect(metric.trend?.delta).toBe(-50);
  });
});
