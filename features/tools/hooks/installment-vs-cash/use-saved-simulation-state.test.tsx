import { act, renderHook } from "@testing-library/react-native";

import { useSavedSimulationState } from "./use-saved-simulation-state";

const calculation: InstallmentVsCashCalculation = {
  toolId: "installment_vs_cash",
  ruleVersion: "2026.1",
  input: {
    cashPrice: 1000,
    installmentCount: 6,
    installmentAmount: 200,
    installmentTotal: 1200,
    firstPaymentDelayDays: 30,
    opportunityRateType: "manual",
    opportunityRateAnnual: 12,
    inflationRateAnnual: 4.5,
    feesUpfront: 0,
    scenarioLabel: "Notebook",
  },
  result: {
    recommendedOption: "cash",
    recommendationReason: "A vista vence.",
    formulaExplainer: "Explicacao",
    comparison: {
      cashOptionTotal: 1000,
      installmentOptionTotal: 1200,
      installmentPresentValue: 1050,
      installmentRealValueToday: 1030,
      presentValueDeltaVsCash: 50,
      absoluteDeltaVsCash: 200,
      relativeDeltaVsCashPercent: 5,
      breakEvenDiscountPercent: 7,
      breakEvenOpportunityRateAnnual: 14,
    },
    options: {
      cash: { total: 1000 },
      installment: {
        count: 6,
        amounts: [200],
        installmentAmount: 200,
        nominalTotal: 1200,
        upfrontFees: 0,
        firstPaymentDelayDays: 30,
      },
    },
    neutralityBand: {
      absoluteBrl: 25,
      relativePercent: 1.5,
    },
    assumptions: {
      opportunityRateType: "manual",
      opportunityRateAnnualPercent: 12,
      inflationRateAnnualPercent: 4.5,
      periodicity: "monthly",
      firstPaymentDelayDays: 30,
      upfrontFeesApplyTo: "installment",
      neutralityRule: "mixed",
    },
    indicatorSnapshot: null,
    schedule: [],
  },
};

const draft = {
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

describe("useSavedSimulationState", () => {
  it("persiste a simulacao apenas uma vez e reaproveita o cache local", async () => {
    const mutateAsync = jest.fn().mockResolvedValue({
      simulation: {
        id: "sim-1",
        userId: "user-1",
        toolId: "installment_vs_cash",
        ruleVersion: "2026.1",
        inputs: calculation.input,
        result: calculation.result,
        saved: true,
        goalId: null,
        createdAt: "2026-04-07T10:00:00Z",
      },
    });

    const { result } = renderHook(() =>
      useSavedSimulationState(calculation, draft, {
        mutateAsync,
      }),
    );

    await act(async () => {
      await result.current.ensureSavedSimulation();
      await result.current.ensureSavedSimulation();
    });

    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("falha cedo quando ainda nao existe calculo", async () => {
    const { result } = renderHook(() =>
      useSavedSimulationState(null, draft, {
        mutateAsync: jest.fn(),
      }),
    );

    await expect(result.current.ensureSavedSimulation()).rejects.toThrow(
      "Calcule antes de salvar.",
    );
  });
});
import type { InstallmentVsCashCalculation } from "@/features/tools/contracts";
