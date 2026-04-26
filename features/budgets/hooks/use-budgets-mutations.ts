import { useQueryClient } from "@tanstack/react-query";

import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  Budget,
  CreateBudgetCommand,
  UpdateBudgetCommand,
} from "@/features/budgets/contracts";
import { budgetsService } from "@/features/budgets/services/budgets-service";

const useInvalidateBudgets = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.budgets.root });
  };
};

export const useCreateBudgetMutation = () => {
  const invalidate = useInvalidateBudgets();
  return createApiMutation<Budget, CreateBudgetCommand>(
    (command) => budgetsService.createBudget(command),
    { onSuccess: invalidate },
  );
};

export const useUpdateBudgetMutation = () => {
  const invalidate = useInvalidateBudgets();
  return createApiMutation<Budget, UpdateBudgetCommand>(
    (command) => budgetsService.updateBudget(command),
    { onSuccess: invalidate },
  );
};

export const useDeleteBudgetMutation = () => {
  const invalidate = useInvalidateBudgets();
  return createApiMutation<void, string>(
    (budgetId) => budgetsService.deleteBudget(budgetId),
    { onSuccess: invalidate },
  );
};
