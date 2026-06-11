import { useMemo } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import type { Budget } from "@/features/budgets/contracts";
import { useBudgetsQuery } from "@/features/budgets/hooks/use-budgets-query";
import {
  getBudgetUsageLevel,
  resolveBudgetPeriodRange,
  type BudgetUsageLevel,
} from "@/features/budgets/services/budget-risk";
import type { TransactionRecord } from "@/features/transactions/contracts";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";

const PREVIEW_LIMIT = 5;

export interface UseBudgetDetailScreenControllerOptions {
  /** Overrides the route param — used in tests. */
  readonly budgetId?: string;
}

export interface BudgetDetailScreenController {
  readonly budgetId: string;
  readonly budgetsQuery: ReturnType<typeof useBudgetsQuery>;
  readonly budget: Budget | null;
  readonly usageLevel: BudgetUsageLevel;
  readonly notFound: boolean;
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
  readonly previewTransactions: readonly TransactionRecord[];
  readonly handleBack: () => void;
}

const resolveStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

/**
 * Orchestrates the budget detail screen: resolves the budget from the list
 * query, classifies its usage level, and previews the period transactions
 * (filtered by the budget's tag when present). The screen stays view-only.
 */
export function useBudgetDetailScreenController(
  options: UseBudgetDetailScreenControllerOptions = {},
): BudgetDetailScreenController {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const budgetId = options.budgetId ?? resolveStringParam(params.id);
  const budgetsQuery = useBudgetsQuery();

  const budget = useMemo<Budget | null>(
    () => budgetsQuery.data?.find((item) => item.id === budgetId) ?? null,
    [budgetsQuery.data, budgetId],
  );

  const range = resolveBudgetPeriodRange(
    budget ?? ({ startDate: null, endDate: null } as Budget),
    new Date(),
  );

  const transactionsQuery = useTransactionsQuery({
    startDate: range.startDate,
    endDate: range.endDate,
    ...(budget?.tagId ? { tagId: budget.tagId } : {}),
    perPage: PREVIEW_LIMIT,
  });

  const previewTransactions = useMemo<readonly TransactionRecord[]>(
    () => (transactionsQuery.data?.transactions ?? []).slice(0, PREVIEW_LIMIT),
    [transactionsQuery.data],
  );

  return {
    budgetId,
    budgetsQuery,
    budget,
    usageLevel: budget
      ? getBudgetUsageLevel(budget.percentageUsed, budget.isOverBudget)
      : "healthy",
    notFound: !budgetsQuery.isLoading && budget === null,
    transactionsQuery,
    previewTransactions,
    handleBack: () => router.back(),
  };
}
