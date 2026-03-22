import {
  createDefaultInstallmentVsCashFormDraft,
  getRecommendationLabel,
  getSuggestedSelectedOption,
  resolveFirstPaymentDelayDays,
  toInstallmentVsCashCalculationRequest,
  validateInstallmentVsCashDraft,
} from "@/shared/validators/installment-vs-cash";
import type { InstallmentVsCashCalculation } from "@/types/contracts";

describe("installment-vs-cash validator defaults", () => {
  it("cria o draft padrao esperado", () => {
    const draft = createDefaultInstallmentVsCashFormDraft();
    expect(draft.installmentCount).toBe("6");
    expect(draft.opportunityRateType).toBe("manual");
  });

  it("valida campos obrigatorios", () => {
    const errors = validateInstallmentVsCashDraft(
      createDefaultInstallmentVsCashFormDraft(),
    );

    expect(errors.cashPrice).toBeDefined();
    expect(errors.installmentTotal).toBeDefined();
  });
});

describe("installment-vs-cash validator payload", () => {
  it("converte o draft em payload de calculo", () => {
    const draft = {
      ...createDefaultInstallmentVsCashFormDraft(),
      cashPrice: "1000",
      installmentTotal: "1200",
      inflationRateAnnual: "4.5",
      feesEnabled: true,
      feesUpfront: "10",
    };

    expect(toInstallmentVsCashCalculationRequest(draft)).toEqual({
      cash_price: "1000.00",
      installment_count: 6,
      installment_total: "1200.00",
      inflation_rate_annual: "4.50",
      fees_enabled: true,
      fees_upfront: "10.00",
      first_payment_delay_days: 30,
      opportunity_rate_type: "manual",
      opportunity_rate_annual: "12.00",
    });
  });

  it("cobre presets de atraso e modo por parcela", () => {
    const amountDraft = {
      ...createDefaultInstallmentVsCashFormDraft(),
      cashPrice: "1000",
      installmentCount: "4",
      installmentInputMode: "amount" as const,
      installmentAmount: "255.10",
      firstPaymentDelayPreset: "today" as const,
      opportunityRateType: "inflation_only" as const,
      inflationRateAnnual: "5",
    };

    expect(resolveFirstPaymentDelayDays(amountDraft)).toBe(0);
    expect(toInstallmentVsCashCalculationRequest(amountDraft)).toEqual({
      cash_price: "1000.00",
      installment_count: 4,
      installment_amount: "255.10",
      inflation_rate_annual: "5.00",
      fees_enabled: false,
      fees_upfront: "0.00",
      first_payment_delay_days: 0,
      opportunity_rate_type: "inflation_only",
    });
  });
});

describe("installment-vs-cash validator delays and optionals", () => {
  it("resolve o atraso customizado", () => {
    const draft = {
      ...createDefaultInstallmentVsCashFormDraft(),
      firstPaymentDelayPreset: "custom" as const,
      customFirstPaymentDelayDays: "18",
    };

    expect(resolveFirstPaymentDelayDays(draft)).toBe(18);
  });

  it("cobre o preset de 45 dias e validacoes opcionais", () => {
    const invalidDraft = {
      ...createDefaultInstallmentVsCashFormDraft(),
      cashPrice: "1000",
      installmentCount: "0",
      installmentInputMode: "amount" as const,
      installmentAmount: "-10",
      firstPaymentDelayPreset: "45_days" as const,
      opportunityRateType: "manual" as const,
      opportunityRateAnnual: "-1",
      inflationRateAnnual: "-2",
      feesEnabled: true,
      feesUpfront: "-3",
    };

    const errors = validateInstallmentVsCashDraft(invalidDraft);

    expect(resolveFirstPaymentDelayDays(invalidDraft)).toBe(45);
    expect(errors.installmentCount).toBeDefined();
    expect(errors.installmentAmount).toBeDefined();
    expect(errors.opportunityRateAnnual).toBeDefined();
    expect(errors.inflationRateAnnual).toBeDefined();
    expect(errors.feesUpfront).toBeDefined();
  });

  it("cobre atraso customizado invalido", () => {
    const invalidDelayDraft = {
      ...createDefaultInstallmentVsCashFormDraft(),
      cashPrice: "1000",
      installmentTotal: "1200",
      firstPaymentDelayPreset: "custom" as const,
      customFirstPaymentDelayDays: "-2",
    };

    const errors = validateInstallmentVsCashDraft(invalidDelayDraft);
    expect(errors.customFirstPaymentDelayDays).toBeDefined();
  });
});

describe("installment-vs-cash validator recommendations", () => {
  it("retorna labels e sugestoes coerentes", () => {
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
        scenarioLabel: null,
      },
      result: {
        recommendedOption: "installment",
        recommendationReason: "Parcelado vence.",
        formulaExplainer: "Explicacao",
        comparison: {
          cashOptionTotal: 1000,
          installmentOptionTotal: 1200,
          installmentPresentValue: 950,
          installmentRealValueToday: 930,
          presentValueDeltaVsCash: -50,
          absoluteDeltaVsCash: 200,
          relativeDeltaVsCashPercent: 5,
          breakEvenDiscountPercent: 10,
          breakEvenOpportunityRateAnnual: 14,
        },
        options: {
          cash: { total: 1000 },
          installment: {
            count: 6,
            amounts: [200, 200, 200, 200, 200, 200],
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

    expect(getRecommendationLabel("equivalent")).toContain("empatadas");
    expect(getRecommendationLabel("cash")).toContain("A vista");
    expect(getRecommendationLabel("installment")).toContain("Parcelado");
    expect(getSuggestedSelectedOption(calculation)).toBe("installment");
  });
});
