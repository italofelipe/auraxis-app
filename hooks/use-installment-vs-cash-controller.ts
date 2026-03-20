import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { Alert } from "react-native";

import {
  useCreateGoalFromInstallmentVsCashMutation,
  useCreatePlannedExpenseFromInstallmentVsCashMutation,
  useInstallmentVsCashCalculationMutation,
  useSaveInstallmentVsCashMutation,
  type GoalVariables,
  type PlannedExpenseVariables,
} from "@/hooks/mutations/use-installment-vs-cash-mutations";
import { useEntitlementCheckQuery } from "@/hooks/queries/use-entitlement-check-query";
import { useInstallmentVsCashHistoryQuery } from "@/hooks/queries/use-installment-vs-cash-history-query";
import { useSessionStore } from "@/stores/session-store";
import {
  createDefaultInstallmentVsCashFormDraft,
  getSuggestedSelectedOption,
  toInstallmentVsCashCalculationRequest,
  validateInstallmentVsCashDraft,
  type InstallmentDelayPreset,
  type InstallmentInputMode,
  type InstallmentVsCashFormDraft,
  type InstallmentVsCashFormErrors,
} from "@/shared/validators/installment-vs-cash";
import type {
  CreateInstallmentVsCashGoalPayload,
  CreateInstallmentVsCashPlannedExpensePayload,
  InstallmentVsCashCalculation,
  InstallmentVsCashCalculationRequestDto,
  InstallmentVsCashSavedCalculation,
  InstallmentVsCashSavedSimulation,
  OpportunityRateType,
  SelectedPaymentOption,
} from "@/types/contracts/installment-vs-cash";

type TextFieldName =
  | "scenarioLabel"
  | "cashPrice"
  | "installmentCount"
  | "installmentAmount"
  | "installmentTotal"
  | "customFirstPaymentDelayDays"
  | "opportunityRateAnnual"
  | "inflationRateAnnual"
  | "feesUpfront";

const addDaysToToday = (days: number): string => {
  const baseDate = new Date();
  baseDate.setUTCDate(baseDate.getUTCDate() + days);
  return baseDate.toISOString().slice(0, 10);
};

const showErrorAlert = (title: string, error: unknown): void => {
  Alert.alert(
    title,
    error instanceof Error ? error.message : "Tente novamente em instantes.",
  );
};

const buildGoalPayload = (
  draft: InstallmentVsCashFormDraft,
  calculation: InstallmentVsCashCalculation | null,
  selectedOption: SelectedPaymentOption,
): CreateInstallmentVsCashGoalPayload => ({
  title: draft.scenarioLabel.trim() || "Compra planejada",
  selectedOption,
  description: calculation?.result.recommendationReason,
  priority: 3,
  currentAmount: 0,
});

const buildPlannedExpensePayload = (
  draft: InstallmentVsCashFormDraft,
  calculation: InstallmentVsCashCalculation | null,
  selectedOption: SelectedPaymentOption,
): CreateInstallmentVsCashPlannedExpensePayload => {
  const delayDays =
    selectedOption === "installment"
      ? calculation?.input.firstPaymentDelayDays ?? 0
      : 0;

  return {
    title: draft.scenarioLabel.trim() || "Compra planejada",
    selectedOption,
    description: calculation?.result.recommendationReason,
    dueDate: selectedOption === "cash" ? addDaysToToday(0) : undefined,
    firstDueDate:
      selectedOption === "installment" ? addDaysToToday(delayDays) : undefined,
    upfrontDueDate:
      selectedOption === "installment" && calculation?.input.feesUpfront
        ? addDaysToToday(0)
        : undefined,
  };
};

const useSavedSimulationState = (
  calculation: InstallmentVsCashCalculation | null,
  draft: InstallmentVsCashFormDraft,
  saveMutation: {
    readonly mutateAsync: (
      payload: InstallmentVsCashCalculationRequestDto,
    ) => Promise<InstallmentVsCashSavedCalculation>;
  },
) => {
  const [savedSimulation, setSavedSimulation] =
    useState<InstallmentVsCashSavedSimulation | null>(null);

  const ensureSavedSimulation = async (): Promise<InstallmentVsCashSavedSimulation> => {
    if (savedSimulation !== null) {
      return savedSimulation;
    }

    if (calculation === null) {
      throw new Error("Calcule antes de salvar.");
    }

    const response = await saveMutation.mutateAsync(
      toInstallmentVsCashCalculationRequest(draft),
    );
    setSavedSimulation(response.simulation);
    return response.simulation;
  };

  return {
    savedSimulation,
    setSavedSimulation,
    ensureSavedSimulation,
  };
};

interface InstallmentVsCashDraftState {
  readonly draft: InstallmentVsCashFormDraft;
  readonly errors: InstallmentVsCashFormErrors;
  readonly setErrors: Dispatch<SetStateAction<InstallmentVsCashFormErrors>>;
  readonly setTextField: (field: TextFieldName, value: string) => void;
  readonly setInstallmentMode: (value: InstallmentInputMode) => void;
  readonly setDelayPreset: (value: InstallmentDelayPreset) => void;
  readonly setOpportunityRateType: (value: OpportunityRateType) => void;
  readonly setFeesEnabled: (value: boolean) => void;
}

const useInstallmentVsCashDraftState = (): InstallmentVsCashDraftState => {
  const [draft, setDraft] = useState<InstallmentVsCashFormDraft>(
    createDefaultInstallmentVsCashFormDraft(),
  );
  const [errors, setErrors] = useState<InstallmentVsCashFormErrors>({});

  const updateDraft = (
    updater: (current: InstallmentVsCashFormDraft) => InstallmentVsCashFormDraft,
  ): void => {
    setDraft(updater);
    setErrors((current) => ({ ...current, general: undefined }));
  };

  return {
    draft,
    errors,
    setErrors,
    setTextField: (field, value) => {
      updateDraft((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    },
    setInstallmentMode: (value) => {
      updateDraft((current) => ({ ...current, installmentInputMode: value }));
    },
    setDelayPreset: (value) => {
      updateDraft((current) => ({ ...current, firstPaymentDelayPreset: value }));
    },
    setOpportunityRateType: (value) => {
      updateDraft((current) => ({ ...current, opportunityRateType: value }));
    },
    setFeesEnabled: (value) => {
      updateDraft((current) => ({ ...current, feesEnabled: value }));
    },
  };
};

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

interface InstallmentVsCashActionContext {
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

interface InstallmentVsCashActions {
  readonly handleCalculate: () => Promise<void>;
  readonly handleSave: () => Promise<void>;
  readonly handleCreateGoal: () => Promise<void>;
  readonly handleCreatePlannedExpense: () => Promise<void>;
}

const ensurePremiumAccess = (enabled: boolean, message: string): boolean => {
  if (enabled) {
    return true;
  }

  Alert.alert("Recurso Premium", message);
  return false;
};

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
      !ensurePremiumAccess(
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
        payload: buildGoalPayload(
          context.draft,
          context.calculation,
          context.selectedOption,
        ),
      };
      const response = await context.createGoalMutation.mutateAsync(variables);
      Alert.alert("Meta criada", `A meta "${response.goal.title}" foi criada.`);
    } catch (error) {
      showErrorAlert("Nao foi possivel criar a meta", error);
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
      !ensurePremiumAccess(
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
        payload: buildPlannedExpensePayload(
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
      showErrorAlert("Nao foi possivel planejar a despesa", error);
    }
  };
};

const useInstallmentVsCashActions = ({
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
      showErrorAlert("Nao foi possivel calcular", error);
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
      showErrorAlert("Nao foi possivel salvar", error);
    }
  };

  const handleCreateGoal = createGoalHandler({
    draft,
    calculation,
    selectedOption,
    premiumEnabled,
    createGoalMutation,
    ensureSavedSimulation,
  });

  const handleCreatePlannedExpense = createPlannedExpenseHandler({
    draft,
    calculation,
    selectedOption,
    premiumEnabled,
    createPlannedExpenseMutation,
    ensureSavedSimulation,
  });

  return {
    handleCalculate,
    handleSave,
    handleCreateGoal,
    handleCreatePlannedExpense,
  };
};

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
  readonly handleCalculate: () => Promise<void>;
  readonly handleSave: () => Promise<void>;
  readonly handleCreateGoal: () => Promise<void>;
  readonly handleCreatePlannedExpense: () => Promise<void>;
}

export const useInstallmentVsCashController =
(): InstallmentVsCashController => {
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
  } = useInstallmentVsCashActions({
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
    handleCalculate,
    handleSave,
    handleCreateGoal,
    handleCreatePlannedExpense,
  };
};
