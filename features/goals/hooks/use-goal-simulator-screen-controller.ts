import { useState } from "react";

import type { SimulatedGoalPlan } from "@/features/goals/contracts";
import { useSimulateGoalMutation } from "@/features/goals/hooks/use-goals-simulator-mutation";
import type { SimulateGoalFormValues } from "@/features/goals/validators-simulator";

export interface GoalSimulatorScreenController {
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly result: SimulatedGoalPlan | null;
  readonly handleSubmit: (values: SimulateGoalFormValues) => Promise<void>;
  readonly handleReset: () => void;
  readonly dismissSubmitError: () => void;
}

export function useGoalSimulatorScreenController(): GoalSimulatorScreenController {
  const mutation = useSimulateGoalMutation();
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [result, setResult] = useState<SimulatedGoalPlan | null>(null);

  const handleSubmit = async (
    values: SimulateGoalFormValues,
  ): Promise<void> => {
    setSubmitError(null);
    try {
      const plan = await mutation.mutateAsync({
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount,
        targetDate: values.targetDate ?? null,
        monthlyIncome: values.monthlyIncome ?? null,
        monthlyExpenses: values.monthlyExpenses ?? null,
        monthlyContribution: values.monthlyContribution ?? null,
      });
      setResult(plan);
    } catch (error) {
      setSubmitError(error);
    }
  };

  return {
    isSubmitting: mutation.isPending,
    submitError,
    result,
    handleSubmit,
    handleReset: () => {
      setResult(null);
      setSubmitError(null);
      mutation.reset();
    },
    dismissSubmitError: () => {
      setSubmitError(null);
      mutation.reset();
    },
  };
}
