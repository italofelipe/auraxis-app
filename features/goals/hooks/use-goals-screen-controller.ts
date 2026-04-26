import { useMemo, useState } from "react";

import type { GoalRecord } from "@/features/goals/contracts";
import {
  useCreateGoalMutation,
  useDeleteGoalMutation,
  useUpdateGoalMutation,
} from "@/features/goals/hooks/use-goals-mutations";
import { useGoalsQuery } from "@/features/goals/hooks/use-goals-query";
import {
  goalProgressCalculator,
  type GoalProgressView,
} from "@/features/goals/services/goal-progress-calculator";
import type { CreateGoalFormValues } from "@/features/goals/validators";

export type GoalFormMode =
  | { readonly kind: "closed" }
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly goal: GoalRecord };

export interface GoalsScreenSummary {
  readonly total: number;
  readonly active: number;
  readonly completed: number;
}

export interface GoalsScreenController {
  readonly goalsQuery: ReturnType<typeof useGoalsQuery>;
  readonly goals: readonly GoalProgressView[];
  readonly summary: GoalsScreenSummary;
  readonly formMode: GoalFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingGoalId: string | null;
  readonly selectedPlanGoalId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleOpenEdit: (goal: GoalRecord) => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateGoalFormValues) => Promise<void>;
  readonly handleDelete: (goalId: string) => Promise<void>;
  readonly handleTogglePlan: (goalId: string) => void;
  readonly dismissSubmitError: () => void;
}

const buildSummary = (goals: readonly GoalProgressView[]): GoalsScreenSummary => {
  return {
    total: goals.length,
    active: goals.filter((goal) => !goal.isCompleted).length,
    completed: goals.filter((goal) => goal.isCompleted).length,
  };
};

interface SubmitHandlerDeps {
  readonly formMode: GoalFormMode;
  readonly createMutation: ReturnType<typeof useCreateGoalMutation>;
  readonly updateMutation: ReturnType<typeof useUpdateGoalMutation>;
  readonly setFormMode: (mode: GoalFormMode) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildSubmitHandler = ({
  formMode,
  createMutation,
  updateMutation,
  setFormMode,
  setSubmitError,
}: SubmitHandlerDeps) => {
  return async (values: CreateGoalFormValues): Promise<void> => {
    setSubmitError(null);
    try {
      const payload = {
        title: values.title,
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount,
        targetDate: values.targetDate,
      };
      if (formMode.kind === "edit") {
        await updateMutation.mutateAsync({ goalId: formMode.goal.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setFormMode({ kind: "closed" });
    } catch (error) {
      setSubmitError(error);
    }
  };
};

interface DeleteHandlerDeps {
  readonly deleteMutation: ReturnType<typeof useDeleteGoalMutation>;
  readonly setDeletingGoalId: (id: string | null) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildDeleteHandler = ({
  deleteMutation,
  setDeletingGoalId,
  setSubmitError,
}: DeleteHandlerDeps) => {
  return async (goalId: string): Promise<void> => {
    setDeletingGoalId(goalId);
    try {
      await deleteMutation.mutateAsync(goalId);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingGoalId(null);
    }
  };
};

/**
 * Canonical controller for the goals screen. Owns the create/edit form
 * state machine, the per-goal delete tracker and the mutations. The screen
 * remains view-only.
 */
export function useGoalsScreenController(): GoalsScreenController {
  const goalsQuery = useGoalsQuery();
  const createMutation = useCreateGoalMutation();
  const updateMutation = useUpdateGoalMutation();
  const deleteMutation = useDeleteGoalMutation();
  const [formMode, setFormMode] = useState<GoalFormMode>({ kind: "closed" });
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [selectedPlanGoalId, setSelectedPlanGoalId] = useState<string | null>(null);

  const goals = useMemo<readonly GoalProgressView[]>(() => {
    const records = goalsQuery.data?.goals ?? [];
    return goalProgressCalculator.mapAll(records);
  }, [goalsQuery.data]);

  const summary = useMemo<GoalsScreenSummary>(() => buildSummary(goals), [goals]);

  const handleSubmit = buildSubmitHandler({
    formMode,
    createMutation,
    updateMutation,
    setFormMode,
    setSubmitError,
  });

  const handleDelete = buildDeleteHandler({
    deleteMutation,
    setDeletingGoalId,
    setSubmitError,
  });

  return {
    goalsQuery,
    goals,
    summary,
    formMode,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
    deletingGoalId,
    selectedPlanGoalId,
    handleOpenCreate: () => {
      setSubmitError(null);
      setFormMode({ kind: "create" });
    },
    handleOpenEdit: (goal) => {
      setSubmitError(null);
      setFormMode({ kind: "edit", goal });
    },
    handleCloseForm: () => {
      setSubmitError(null);
      setFormMode({ kind: "closed" });
    },
    handleSubmit,
    handleDelete,
    handleTogglePlan: (goalId: string) => {
      setSelectedPlanGoalId((current) => (current === goalId ? null : goalId));
    },
    dismissSubmitError: () => {
      setSubmitError(null);
      createMutation.reset();
      updateMutation.reset();
    },
  };
}
