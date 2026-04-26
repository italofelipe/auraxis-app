import { useState } from "react";

import type { Budget } from "@/features/budgets/contracts";
import {
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
  useUpdateBudgetMutation,
} from "@/features/budgets/hooks/use-budgets-mutations";
import {
  useBudgetSummaryQuery,
  useBudgetsQuery,
} from "@/features/budgets/hooks/use-budgets-query";
import type { CreateBudgetFormValues } from "@/features/budgets/validators";

export type BudgetFormMode =
  | { readonly kind: "closed" }
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly budget: Budget };

export interface BudgetsScreenController {
  readonly budgetsQuery: ReturnType<typeof useBudgetsQuery>;
  readonly summaryQuery: ReturnType<typeof useBudgetSummaryQuery>;
  readonly budgets: readonly Budget[];
  readonly formMode: BudgetFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingBudgetId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleOpenEdit: (budget: Budget) => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateBudgetFormValues) => Promise<void>;
  readonly handleDelete: (budgetId: string) => Promise<void>;
  readonly dismissSubmitError: () => void;
}

interface SubmitDeps {
  readonly formMode: BudgetFormMode;
  readonly createMutation: ReturnType<typeof useCreateBudgetMutation>;
  readonly updateMutation: ReturnType<typeof useUpdateBudgetMutation>;
  readonly setFormMode: (mode: BudgetFormMode) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildSubmitHandler = ({
  formMode,
  createMutation,
  updateMutation,
  setFormMode,
  setSubmitError,
}: SubmitDeps) => {
  return async (values: CreateBudgetFormValues): Promise<void> => {
    setSubmitError(null);
    try {
      if (formMode.kind === "edit") {
        await updateMutation.mutateAsync({
          budgetId: formMode.budget.id,
          ...values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormMode({ kind: "closed" });
    } catch (error) {
      setSubmitError(error);
    }
  };
};

interface DeleteDeps {
  readonly deleteMutation: ReturnType<typeof useDeleteBudgetMutation>;
  readonly setDeletingBudgetId: (id: string | null) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildDeleteHandler = ({
  deleteMutation,
  setDeletingBudgetId,
  setSubmitError,
}: DeleteDeps) => {
  return async (budgetId: string): Promise<void> => {
    setDeletingBudgetId(budgetId);
    try {
      await deleteMutation.mutateAsync(budgetId);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingBudgetId(null);
    }
  };
};

export function useBudgetsScreenController(): BudgetsScreenController {
  const budgetsQuery = useBudgetsQuery();
  const summaryQuery = useBudgetSummaryQuery();
  const createMutation = useCreateBudgetMutation();
  const updateMutation = useUpdateBudgetMutation();
  const deleteMutation = useDeleteBudgetMutation();
  const [formMode, setFormMode] = useState<BudgetFormMode>({ kind: "closed" });
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const handleSubmit = buildSubmitHandler({
    formMode,
    createMutation,
    updateMutation,
    setFormMode,
    setSubmitError,
  });

  const handleDelete = buildDeleteHandler({
    deleteMutation,
    setDeletingBudgetId,
    setSubmitError,
  });

  return {
    budgetsQuery,
    summaryQuery,
    budgets: budgetsQuery.data ?? [],
    formMode,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
    deletingBudgetId,
    handleOpenCreate: () => {
      setSubmitError(null);
      setFormMode({ kind: "create" });
    },
    handleOpenEdit: (budget) => {
      setSubmitError(null);
      setFormMode({ kind: "edit", budget });
    },
    handleCloseForm: () => {
      setSubmitError(null);
      setFormMode({ kind: "closed" });
    },
    handleSubmit,
    handleDelete,
    dismissSubmitError: () => {
      setSubmitError(null);
      createMutation.reset();
      updateMutation.reset();
    },
  };
}
