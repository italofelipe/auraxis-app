import { useState } from "react";

import type { SalaryIncreaseSimulation } from "@/features/user-profile/contracts";
import { useSalarySimulatorMutation } from "@/features/user-profile/hooks/use-salary-simulator-mutation";
import type { SimulateSalaryIncreaseFormValues } from "@/features/user-profile/validators-salary-sim";

export interface SalarySimulatorScreenController {
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly result: SalaryIncreaseSimulation | null;
  readonly handleSubmit: (
    values: SimulateSalaryIncreaseFormValues,
  ) => Promise<void>;
  readonly handleReset: () => void;
  readonly dismissSubmitError: () => void;
}

export function useSalarySimulatorScreenController(): SalarySimulatorScreenController {
  const mutation = useSalarySimulatorMutation();
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [result, setResult] = useState<SalaryIncreaseSimulation | null>(null);

  const handleSubmit = async (
    values: SimulateSalaryIncreaseFormValues,
  ): Promise<void> => {
    setSubmitError(null);
    try {
      const simulation = await mutation.mutateAsync(values);
      setResult(simulation);
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
