import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { Budget, BudgetSummary } from "@/features/budgets/contracts";
import { budgetsService } from "@/features/budgets/services/budgets-service";

export const useBudgetsQuery = () => {
  return createApiQuery<readonly Budget[]>(queryKeys.budgets.list(), () =>
    budgetsService.listBudgets(),
  );
};

export const useBudgetSummaryQuery = () => {
  return createApiQuery<BudgetSummary>(queryKeys.budgets.summary(), () =>
    budgetsService.getSummary(),
  );
};
