import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import {
  useCreateGoalFromInstallmentVsCashMutation,
  useCreatePlannedExpenseFromInstallmentVsCashMutation,
  useInstallmentVsCashCalculationMutation,
  useSaveInstallmentVsCashMutation,
} from "@/features/tools/hooks/use-installment-vs-cash-mutations";
import { useEntitlementCheckQuery } from "@/features/entitlements/hooks/use-entitlement-check-query";
import { useInstallmentVsCashHistoryQuery } from "@/features/tools/hooks/use-installment-vs-cash-history-query";
import { useSessionStore } from "@/core/session/session-store";
import {
  getSuggestedSelectedOption,
  type InstallmentDelayPreset,
  type InstallmentInputMode,
  type InstallmentVsCashFormDraft,
  type InstallmentVsCashFormErrors,
} from "@/shared/validators/installment-vs-cash";
import type {
  InstallmentVsCashCalculation,
  InstallmentVsCashSavedSimulation,
  OpportunityRateType,
  SelectedPaymentOption,
} from "@/features/tools/contracts";
import {
  createInstallmentVsCashActions,
} from "@/features/tools/hooks/installment-vs-cash/installment-vs-cash-actions";
import {
  useInstallmentVsCashDraftState,
  type TextFieldName,
} from "@/features/tools/hooks/installment-vs-cash/use-installment-vs-cash-draft-state";
import { useSavedSimulationState } from "@/features/tools/hooks/installment-vs-cash/use-saved-simulation-state";

interface InstallmentVsCashMutationState {
  readonly calculateMutation: ReturnType<typeof useInstallmentVsCashCalculationMutation>;
  readonly saveMutation: ReturnType<typeof useSaveInstallmentVsCashMutation>;
  readonly createGoalMutation: ReturnType<typeof useCreateGoalFromInstallmentVsCashMutation>;
  readonly createPlannedExpenseMutation: ReturnType<typeof useCreatePlannedExpenseFromInstallmentVsCashMutation>;
}

const useInstallmentVsCashMutations = (): InstallmentVsCashMutationState => ({
  calculateMutation: useInstallmentVsCashCalculationMutation(),
  saveMutation: useSaveInstallmentVsCashMutation(),
  createGoalMutation: useCreateGoalFromInstallmentVsCashMutation(),
  createPlannedExpenseMutation:
    useCreatePlannedExpenseFromInstallmentVsCashMutation(),
});

export interface InstallmentVsCashController {
  readonly draft: InstallmentVsCashFormDraft;
  readonly errors: InstallmentVsCashFormErrors;
  readonly calculation: InstallmentVsCashCalculation | null;
  readonly selectedOption: SelectedPaymentOption;
  readonly historyQuery: ReturnType<typeof useInstallmentVsCashHistoryQuery>;
  readonly premiumQuery: ReturnType<typeof useEntitlementCheckQuery>;
  readonly calculateMutation: ReturnType<typeof useInstallmentVsCashCalculationMutation>;
  readonly saveMutation: ReturnType<typeof useSaveInstallmentVsCashMutation>;
  readonly createGoalMutation: ReturnType<typeof useCreateGoalFromInstallmentVsCashMutation>;
  readonly createPlannedExpenseMutation: ReturnType<typeof useCreatePlannedExpenseFromInstallmentVsCashMutation>;
  readonly setTextField: (field: TextFieldName, value: string) => void;
  readonly setInstallmentMode: (value: InstallmentInputMode) => void;
  readonly setDelayPreset: (value: InstallmentDelayPreset) => void;
  readonly setOpportunityRateType: (value: OpportunityRateType) => void;
  readonly setFeesEnabled: (value: boolean) => void;
  readonly setSelectedOption: (value: SelectedPaymentOption) => void;
  readonly handleGoBack: () => void;
  readonly handleCalculate: () => Promise<void>;
  readonly handleSave: () => Promise<void>;
  readonly handleCreateGoal: () => Promise<void>;
  readonly handleCreatePlannedExpense: () => Promise<void>;
}

/**
 * Creates the canonical controller for the installment-vs-cash route.
 *
 * @returns View bindings for the full simulation flow and its planning actions.
 */
export const useInstallmentVsCashScreenController =
(): InstallmentVsCashController => {
  const router = useRouter();
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const {
    draft,
    errors,
    setErrors,
    setTextField,
    setInstallmentMode,
    setDelayPreset,
    setOpportunityRateType,
    setFeesEnabled,
  } = useInstallmentVsCashDraftState();
  const [calculation, setCalculation] =
    useState<InstallmentVsCashCalculation | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<SelectedPaymentOption>("cash");

  const {
    calculateMutation,
    saveMutation,
    createGoalMutation,
    createPlannedExpenseMutation,
  } = useInstallmentVsCashMutations();
  const historyQuery = useInstallmentVsCashHistoryQuery(isAuthenticated);
  const premiumQuery = useEntitlementCheckQuery(
    "advanced_simulations",
    isAuthenticated,
  );

  const { ensureSavedSimulation, setSavedSimulation } = useSavedSimulationState(
    calculation,
    draft,
    saveMutation,
  );

  const {
    handleCalculate,
    handleSave,
    handleCreateGoal,
    handleCreatePlannedExpense,
  } = createInstallmentVsCashActions({
    draft,
    calculation,
    selectedOption,
    setCalculation,
    setErrors,
    setSavedSimulation,
    premiumEnabled: premiumQuery.data ?? false,
    calculateMutation,
    createGoalMutation,
    createPlannedExpenseMutation,
    ensureSavedSimulation,
  });

  useEffect(() => {
    if (calculation !== null) {
      setSelectedOption(getSuggestedSelectedOption(calculation));
    }
  }, [calculation]);

  return {
    draft,
    errors,
    calculation,
    selectedOption,
    historyQuery,
    premiumQuery,
    calculateMutation,
    saveMutation,
    createGoalMutation,
    createPlannedExpenseMutation,
    setTextField,
    setInstallmentMode,
    setDelayPreset,
    setOpportunityRateType,
    setFeesEnabled,
    setSelectedOption,
    handleGoBack: () => {
      router.back();
    },
    handleCalculate,
    handleSave,
    handleCreateGoal,
    handleCreatePlannedExpense,
  };
};
