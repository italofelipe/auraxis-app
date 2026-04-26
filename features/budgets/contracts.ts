export type BudgetPeriod = "monthly" | "weekly" | "custom";

export interface Budget {
  readonly id: string;
  readonly name: string;
  readonly amount: string;
  readonly spent: string;
  readonly remaining: string;
  readonly percentageUsed: number;
  readonly period: BudgetPeriod;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly tagId: string | null;
  readonly tagName: string | null;
  readonly tagColor: string | null;
  readonly isActive: boolean;
  readonly isOverBudget: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BudgetSummary {
  readonly totalBudgeted: string;
  readonly totalSpent: string;
  readonly totalRemaining: string;
  readonly percentageUsed: number;
  readonly budgetCount: number;
}

export interface CreateBudgetCommand {
  readonly name: string;
  readonly amount: string;
  readonly period?: BudgetPeriod;
  readonly tagId?: string | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
}

export interface UpdateBudgetCommand {
  readonly budgetId: string;
  readonly name?: string;
  readonly amount?: string;
  readonly period?: BudgetPeriod;
  readonly tagId?: string | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly isActive?: boolean;
}
