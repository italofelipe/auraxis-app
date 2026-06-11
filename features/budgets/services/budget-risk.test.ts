import type { Budget } from "@/features/budgets/contracts";
import {
  budgetRiskRank,
  getBudgetUsageLevel,
  resolveBudgetPeriodRange,
  sortBudgetsByRisk,
  type BudgetUsageLevel,
} from "@/features/budgets/services/budget-risk";

const buildBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: "b-1",
  name: "Mercado",
  amount: "1000.00",
  spent: "500.00",
  remaining: "500.00",
  percentageUsed: 50,
  period: "monthly",
  startDate: null,
  endDate: null,
  tagId: null,
  tagName: null,
  tagColor: null,
  isActive: true,
  isOverBudget: false,
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("getBudgetUsageLevel", () => {
  it("classifica danger quando estourado ou >= 100%", () => {
    expect(getBudgetUsageLevel(120, false)).toBe("danger");
    expect(getBudgetUsageLevel(50, true)).toBe("danger");
    expect(getBudgetUsageLevel(100, false)).toBe("danger");
  });

  it("classifica warning entre 80 e 99%", () => {
    expect(getBudgetUsageLevel(80, false)).toBe("warning");
    expect(getBudgetUsageLevel(99.9, false)).toBe("warning");
  });

  it("classifica healthy abaixo de 80%", () => {
    expect(getBudgetUsageLevel(0, false)).toBe("healthy");
    expect(getBudgetUsageLevel(79.9, false)).toBe("healthy");
  });
});

describe("budgetRiskRank", () => {
  it("ordena danger > warning > healthy", () => {
    const rank = (level: BudgetUsageLevel) => budgetRiskRank[level];
    expect(rank("danger")).toBeGreaterThan(rank("warning"));
    expect(rank("warning")).toBeGreaterThan(rank("healthy"));
  });
});

describe("sortBudgetsByRisk", () => {
  it("coloca os mais arriscados primeiro, preservando ordem dentro do nivel", () => {
    const healthy = buildBudget({ id: "h", percentageUsed: 20 });
    const warning = buildBudget({ id: "w", percentageUsed: 85 });
    const danger = buildBudget({ id: "d", percentageUsed: 130, isOverBudget: true });

    const sorted = sortBudgetsByRisk([healthy, warning, danger]);
    expect(sorted.map((b) => b.id)).toEqual(["d", "w", "h"]);
  });

  it("nao muta o array original", () => {
    const input = [buildBudget({ id: "a", percentageUsed: 10 }), buildBudget({ id: "b", percentageUsed: 90 })];
    sortBudgetsByRisk(input);
    expect(input.map((b) => b.id)).toEqual(["a", "b"]);
  });
});

describe("resolveBudgetPeriodRange", () => {
  it("usa as datas do orcamento quando custom com inicio e fim", () => {
    const budget = buildBudget({
      period: "custom",
      startDate: "2026-05-10",
      endDate: "2026-05-20",
    });
    expect(resolveBudgetPeriodRange(budget, new Date("2026-06-11T12:00:00"))).toEqual({
      startDate: "2026-05-10",
      endDate: "2026-05-20",
    });
  });

  it("cai no mes corrente quando nao ha datas explicitas", () => {
    const budget = buildBudget({ period: "monthly", startDate: null, endDate: null });
    expect(resolveBudgetPeriodRange(budget, new Date("2026-06-11T12:00:00"))).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
  });
});
