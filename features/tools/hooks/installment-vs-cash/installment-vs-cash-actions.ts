import type { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";

import type {
  InstallmentVsCashCalculation,
  InstallmentVsCashSavedSimulation,
  SelectedPaymentOption,
} from "@/features/tools/contracts";
import type {
  GoalVariables,
  PlannedExpenseVariables,
  useCreateGoalFromInstallmentVsCashMutation,
  useCreatePlannedExpenseFromInstallmentVsCashMutation,
  useInstallmentVsCashCalculationMutation,
} from "@/features/tools/hooks/use-installment-vs-cash-mutations";
import {
  toInstallmentVsCashCalculationRequest,
  validateInstallmentVsCashDraft,
  type InstallmentVsCashFormDraft,
  type InstallmentVsCashFormErrors,
} from "@/shared/validators/installment-vs-cash";

import {
  buildInstallmentVsCashGoalPayload,
  buildInstallmentVsCashPlannedExpensePayload,
  ensureInstallmentVsCashPremiumAccess,
  showInstallmentVsCashErrorAlert,
} from "./flow-helpers";

export interface InstallmentVsCashActionContext {
  readonly draft: InstallmentVsCashFormDraft;
  readonly calculation: InstallmentVsCashCalculation | null;
  readonly selectedOption: SelectedPaymentOption;
  readonly setCalculation: Dispatch<SetStateAction<InstallmentVsCashCalculation | null>>;
  readonly setErrors: Dispatch<SetStateAction<InstallmentVsCashFormErrors>>;
  readonly setSavedSimulation: Dispatch<
    SetStateAction<InstallmentVsCashSavedSimulation | null>
  >;
  readonly premiumEnabled: boolean;
  readonly calculateMutation: ReturnType<typeof useInstallmentVsCashCalculationMutation>;
  readonly createGoalMutation: ReturnType<typeof useCreateGoalFromInstallmentVsCashMutation>;
  readonly createPlannedExpenseMutation: ReturnType<typeof useCreatePlannedExpenseFromInstallmentVsCashMutation>;
  readonly ensureSavedSimulation: () => Promise<InstallmentVsCashSavedSimulation>;
}

export interface InstallmentVsCashActions {
  readonly handleCalculate: () => Promise<void>;
  readonly handleSave: () => Promise<void>;
  readonly handleCreateGoal: () => Promise<void>;
  readonly handleCreatePlannedExpense: () => Promise<void>;
}

const createGoalHandler = (
  context: Pick<
    InstallmentVsCashActionContext,
    | "draft"
    | "calculation"
    | "selectedOption"
    | "premiumEnabled"
    | "createGoalMutation"
    | "ensureSavedSimulation"
  >,
): (() => Promise<void>) => {
  return async (): Promise<void> => {
    if (
      !ensureInstallmentVsCashPremiumAccess(
        context.premiumEnabled,
        "Transformar esta simulacao em meta exige acesso premium.",
      )
    ) {
      return;
    }

    try {
      const simulation = await context.ensureSavedSimulation();
      const variables: GoalVariables = {
        simulationId: simulation.id,
        payload: buildInstallmentVsCashGoalPayload(
          context.draft,
          context.calculation,
          context.selectedOption,
        ),
      };
      const response = await context.createGoalMutation.mutateAsync(variables);
      Alert.alert("Meta criada", `A meta "${response.goal.title}" foi criada.`);
    } catch (error) {
      showInstallmentVsCashErrorAlert("Nao foi possivel criar a meta", error);
    }
  };
};

const createPlannedExpenseHandler = (
  context: Pick<
    InstallmentVsCashActionContext,
    | "draft"
    | "calculation"
    | "selectedOption"
    | "premiumEnabled"
    | "createPlannedExpenseMutation"
    | "ensureSavedSimulation"
  >,
): (() => Promise<void>) => {
  return async (): Promise<void> => {
    if (
      !ensureInstallmentVsCashPremiumAccess(
        context.premiumEnabled,
        "Planejar a despesa a partir desta simulacao exige acesso premium.",
      )
    ) {
      return;
    }

    try {
      const simulation = await context.ensureSavedSimulation();
      const variables: PlannedExpenseVariables = {
        simulationId: simulation.id,
        payload: buildInstallmentVsCashPlannedExpensePayload(
          context.draft,
          context.calculation,
          context.selectedOption,
        ),
      };
      const response =
        await context.createPlannedExpenseMutation.mutateAsync(variables);
      Alert.alert(
        "Despesa planejada",
        `${response.transactions.length} lancamento(s) planejado(s) criado(s).`,
      );
    } catch (error) {
      showInstallmentVsCashErrorAlert(
        "Nao foi possivel planejar a despesa",
        error,
      );
    }
  };
};

/**
 * Creates the async action handlers for the installment-vs-cash flow.
 *
 * @param context Current draft, mutations and premium state.
 * @returns Stable action callbacks for calculate/save/goal/planned-expense.
 */
export const createInstallmentVsCashActions = ({
  draft,
  calculation,
  selectedOption,
  setCalculation,
  setErrors,
  setSavedSimulation,
  premiumEnabled,
  calculateMutation,
  createGoalMutation,
  createPlannedExpenseMutation,
  ensureSavedSimulation,
}: InstallmentVsCashActionContext): InstallmentVsCashActions => {
  const handleCalculate = async (): Promise<void> => {
    const nextErrors = validateInstallmentVsCashDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      const response = await calculateMutation.mutateAsync(
        toInstallmentVsCashCalculationRequest(draft),
      );
      setCalculation(response);
      setSavedSimulation(null);
      setErrors({});
    } catch (error) {
      showInstallmentVsCashErrorAlert("Nao foi possivel calcular", error);
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      await ensureSavedSimulation();
      Alert.alert(
        "Simulacao salva",
        "O resultado ja esta disponivel no seu historico do app.",
      );
    } catch (error) {
      showInstallmentVsCashErrorAlert("Nao foi possivel salvar", error);
    }
  };

  return {
    handleCalculate,
    handleSave,
    handleCreateGoal: createGoalHandler({
      draft,
      calculation,
      selectedOption,
      premiumEnabled,
      createGoalMutation,
      ensureSavedSimulation,
    }),
    handleCreatePlannedExpense: createPlannedExpenseHandler({
      draft,
      calculation,
      selectedOption,
      premiumEnabled,
      createPlannedExpenseMutation,
      ensureSavedSimulation,
    }),
  };
};
