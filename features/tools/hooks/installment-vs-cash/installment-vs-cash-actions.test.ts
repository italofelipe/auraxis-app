import { Alert } from "react-native";

import { createInstallmentVsCashActions } from "./installment-vs-cash-actions";

const baseDraft = {
  scenarioLabel: "Notebook",
  cashPrice: "1000",
  installmentCount: "6",
  installmentInputMode: "total" as const,
  installmentAmount: "",
  installmentTotal: "1200",
  firstPaymentDelayPreset: "30_days" as const,
  customFirstPaymentDelayDays: "",
  opportunityRateType: "manual" as const,
  opportunityRateAnnual: "12",
  inflationRateAnnual: "4.5",
  feesEnabled: false,
  feesUpfront: "",
};

describe("createInstallmentVsCashActions", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("valida o draft antes de calcular", async () => {
    const setErrors = jest.fn();

    const actions = createInstallmentVsCashActions({
      draft: {
        ...baseDraft,
        cashPrice: "",
      },
      calculation: null,
      selectedOption: "cash",
      setCalculation: jest.fn(),
      setErrors,
      setSavedSimulation: jest.fn(),
      premiumEnabled: false,
      calculateMutation: {
        mutateAsync: jest.fn(),
      } as never,
      createGoalMutation: {
        mutateAsync: jest.fn(),
      } as never,
      createPlannedExpenseMutation: {
        mutateAsync: jest.fn(),
      } as never,
      ensureSavedSimulation: jest.fn(),
    });

    await actions.handleCalculate();

    expect(setErrors).toHaveBeenCalled();
  });

  it("mostra alerta ao salvar com sucesso", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());

    const actions = createInstallmentVsCashActions({
      draft: baseDraft,
      calculation: null,
      selectedOption: "cash",
      setCalculation: jest.fn(),
      setErrors: jest.fn(),
      setSavedSimulation: jest.fn(),
      premiumEnabled: false,
      calculateMutation: {
        mutateAsync: jest.fn(),
      } as never,
      createGoalMutation: {
        mutateAsync: jest.fn(),
      } as never,
      createPlannedExpenseMutation: {
        mutateAsync: jest.fn(),
      } as never,
      ensureSavedSimulation: jest.fn().mockResolvedValue({
        id: "sim-1",
      }),
    });

    await actions.handleSave();

    expect(alertSpy).toHaveBeenCalledWith(
      "Simulacao salva",
      "O resultado ja esta disponivel no seu historico do app.",
    );
  });

  it("bloqueia a criacao de meta sem premium", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());

    const createGoalMutation = {
      mutateAsync: jest.fn(),
    };

    const actions = createInstallmentVsCashActions({
      draft: baseDraft,
      calculation: null,
      selectedOption: "cash",
      setCalculation: jest.fn(),
      setErrors: jest.fn(),
      setSavedSimulation: jest.fn(),
      premiumEnabled: false,
      calculateMutation: {
        mutateAsync: jest.fn(),
      } as never,
      createGoalMutation: createGoalMutation as never,
      createPlannedExpenseMutation: {
        mutateAsync: jest.fn(),
      } as never,
      ensureSavedSimulation: jest.fn(),
    });

    await actions.handleCreateGoal();

    expect(alertSpy).toHaveBeenCalledWith(
      "Recurso Premium",
      "Transformar esta simulacao em meta exige acesso premium.",
    );
    expect(createGoalMutation.mutateAsync).not.toHaveBeenCalled();
  });
});
