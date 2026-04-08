import {
  addDaysToToday,
  buildInstallmentVsCashGoalPayload,
  buildInstallmentVsCashPlannedExpensePayload,
  ensureInstallmentVsCashPremiumAccess,
  showInstallmentVsCashErrorAlert,
} from "./flow-helpers";

const draft = {
  scenarioLabel: "Notebook novo",
  cashPrice: "5000",
  installmentCount: "10",
  installmentInputMode: "total" as const,
  installmentAmount: "",
  installmentTotal: "5600",
  firstPaymentDelayPreset: "30_days" as const,
  customFirstPaymentDelayDays: "",
  opportunityRateType: "manual" as const,
  opportunityRateAnnual: "12",
  inflationRateAnnual: "4.5",
  feesEnabled: true,
  feesUpfront: "200",
};

const calculation: InstallmentVsCashCalculation = {
  toolId: "installment_vs_cash",
  ruleVersion: "2026.1",
  input: {
    cashPrice: 5000,
    installmentCount: 10,
    installmentAmount: 560,
    installmentTotal: 5600,
    firstPaymentDelayDays: 45,
    opportunityRateType: "manual",
    opportunityRateAnnual: 12,
    inflationRateAnnual: 4.5,
    feesUpfront: 200,
    scenarioLabel: "Notebook novo",
  },
  result: {
    recommendedOption: "cash",
    recommendationReason: "Desconto compensa.",
    formulaExplainer: "Explicacao",
    comparison: {
      cashOptionTotal: 5000,
      installmentOptionTotal: 5600,
      installmentPresentValue: 5200,
      installmentRealValueToday: 5150,
      presentValueDeltaVsCash: 200,
      absoluteDeltaVsCash: 600,
      relativeDeltaVsCashPercent: 4,
      breakEvenDiscountPercent: 7,
      breakEvenOpportunityRateAnnual: 14,
    },
    options: {
      cash: { total: 5000 },
      installment: {
        count: 10,
        amounts: [560],
        installmentAmount: 560,
        nominalTotal: 5600,
        upfrontFees: 200,
        firstPaymentDelayDays: 45,
      },
    },
    neutralityBand: {
      absoluteBrl: 20,
      relativePercent: 1,
    },
    assumptions: {
      opportunityRateType: "manual",
      opportunityRateAnnualPercent: 12,
      inflationRateAnnualPercent: 4.5,
      periodicity: "monthly",
      firstPaymentDelayDays: 45,
      upfrontFeesApplyTo: "installment",
      neutralityRule: "mixed",
    },
    indicatorSnapshot: null,
    schedule: [],
  },
};

describe("installment-vs-cash flow helpers", () => {
  it("calcula datas relativas de forma determinística", () => {
    expect(addDaysToToday(10, new Date("2026-04-07T00:00:00Z"))).toBe(
      "2026-04-17",
    );
  });

  it("monta o payload de meta com o label canônico", () => {
    expect(
      buildInstallmentVsCashGoalPayload(draft, calculation, "cash"),
    ).toEqual({
      title: "Notebook novo",
      selectedOption: "cash",
      description: "Desconto compensa.",
      priority: 3,
      currentAmount: 0,
    });
  });

  it("monta o payload de despesa planejada para parcela e custos iniciais", () => {
    const payload = buildInstallmentVsCashPlannedExpensePayload(
      draft,
      calculation,
      "installment",
    );

    expect(payload.firstDueDate).toBeTruthy();
    expect(payload.upfrontDueDate).toBeTruthy();
    expect(payload.dueDate).toBeUndefined();
  });

  it("bloqueia premium ausente e dispara o alerta canônico", () => {
    const showAlert = jest.fn();

    const allowed = ensureInstallmentVsCashPremiumAccess(
      false,
      "Premium required",
      showAlert,
    );

    expect(allowed).toBe(false);
    expect(showAlert).toHaveBeenCalledWith("Recurso Premium", "Premium required");
  });

  it("normaliza a mensagem de erro no alerta", () => {
    const showAlert = jest.fn();

    showInstallmentVsCashErrorAlert("Falhou", new Error("boom"), showAlert);

    expect(showAlert).toHaveBeenCalledWith("Falhou", "boom");
  });
});
import type { InstallmentVsCashCalculation } from "@/features/tools/contracts";
