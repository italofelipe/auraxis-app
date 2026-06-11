import type { Budget } from "@/features/budgets/contracts";

export type BudgetUsageLevel = "healthy" | "warning" | "danger";

/** Sort weight — higher is riskier. */
export const budgetRiskRank: Record<BudgetUsageLevel, number> = {
  danger: 2,
  warning: 1,
  healthy: 0,
};

export const BUDGET_USAGE_LABELS: Record<BudgetUsageLevel, string> = {
  healthy: "Saudavel",
  warning: "Atencao",
  danger: "Estourado",
};

export const BUDGET_USAGE_TONE: Record<BudgetUsageLevel, "default" | "primary" | "danger"> = {
  healthy: "primary",
  warning: "default",
  danger: "danger",
};

/**
 * Classifies a budget by how close it is to the spending limit. Mirrors the
 * web thresholds: danger when over/≥100%, warning at ≥80%, else healthy.
 */
export const getBudgetUsageLevel = (
  percentageUsed: number,
  isOverBudget: boolean,
): BudgetUsageLevel => {
  if (isOverBudget || percentageUsed >= 100) {
    return "danger";
  }
  if (percentageUsed >= 80) {
    return "warning";
  }
  return "healthy";
};

const levelOf = (budget: Budget): BudgetUsageLevel =>
  getBudgetUsageLevel(budget.percentageUsed, budget.isOverBudget);

/**
 * Returns a new array ordered by risk (danger first), preserving the original
 * order within a level (stable). Does not mutate the input.
 */
export const sortBudgetsByRisk = (budgets: readonly Budget[]): Budget[] =>
  [...budgets].sort(
    (left, right) => budgetRiskRank[levelOf(right)] - budgetRiskRank[levelOf(left)],
  );

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export interface BudgetPeriodRange {
  readonly startDate: string;
  readonly endDate: string;
}

/**
 * Resolves the date range used to preview a budget's transactions: the
 * explicit custom dates when present, otherwise the current month.
 */
export const resolveBudgetPeriodRange = (
  budget: Budget,
  now: Date,
): BudgetPeriodRange => {
  if (budget.startDate && budget.endDate) {
    return { startDate: budget.startDate, endDate: budget.endDate };
  }
  return {
    startDate: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};
