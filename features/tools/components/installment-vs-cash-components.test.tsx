import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { InstallmentVsCashForm } from "@/features/tools/components/installment-vs-cash-form";
import { InstallmentVsCashHistoryList } from "@/features/tools/components/installment-vs-cash-history-list";
import { InstallmentVsCashResultCard } from "@/features/tools/components/installment-vs-cash-result-card";
import type {
  InstallmentVsCashCalculation,
  InstallmentVsCashSavedSimulation,
} from "@/features/tools/contracts";
import { createDefaultInstallmentVsCashFormDraft } from "@/shared/validators/installment-vs-cash";

const buildCalculation = (): InstallmentVsCashCalculation => ({
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
        amounts: [200, 200, 200],
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
    indicatorSnapshot: {
      presetType: "product_default",
      source: "Auraxis",
      annualRatePercent: 12.5,
      asOf: "2026-03-20",
    },
    schedule: [],
  },
});

const buildHistoryItem = (): InstallmentVsCashSavedSimulation => ({
  id: "sim-1",
  userId: "user-1",
  toolId: "installment_vs_cash",
  ruleVersion: "2026.1",
  inputs: buildCalculation().input,
  result: buildCalculation().result,
  saved: true,
  goalId: null,
  createdAt: "2026-03-20T10:00:00Z",
});

describe("installment-vs-cash feature components", () => {
  it("renderiza a variacao detalhada do formulario e dispara handlers canônicos", () => {
    const onTextChange = jest.fn();
    const onInstallmentModeChange = jest.fn();
    const onDelayPresetChange = jest.fn();
    const onOpportunityRateTypeChange = jest.fn();
    const onFeesEnabledChange = jest.fn();
    const onSubmit = jest.fn();

    const draft = {
      ...createDefaultInstallmentVsCashFormDraft(),
      installmentInputMode: "amount" as const,
      firstPaymentDelayPreset: "custom" as const,
      customFirstPaymentDelayDays: "18",
      opportunityRateType: "manual" as const,
      feesEnabled: true,
      feesUpfront: "45",
    };

    const { getByDisplayValue, getByText } = render(
      <AppProviders>
        <InstallmentVsCashForm
          draft={draft}
          errors={{
            installmentAmount: "Informe a parcela",
            feesUpfront: "Informe os custos",
          }}
          isSubmitting={false}
          onTextChange={onTextChange}
          onInstallmentModeChange={onInstallmentModeChange}
          onDelayPresetChange={onDelayPresetChange}
          onOpportunityRateTypeChange={onOpportunityRateTypeChange}
          onFeesEnabledChange={onFeesEnabledChange}
          onSubmit={onSubmit}
        />
      </AppProviders>,
    );

    expect(getByText("Valor de cada parcela")).toBeTruthy();
    expect(getByText("Primeira parcela em quantos dias?")).toBeTruthy();
    expect(getByText("Custos extras iniciais")).toBeTruthy();

    fireEvent.press(getByText("Total parcelado"));
    fireEvent.press(getByText("Hoje"));
    fireEvent.press(getByText("Apenas inflacao"));
    fireEvent.press(getByText("Calcular agora"));
    fireEvent.changeText(getByDisplayValue("18"), "21");

    expect(onInstallmentModeChange).toHaveBeenCalledWith("total");
    expect(onDelayPresetChange).toHaveBeenCalledWith("today");
    expect(onOpportunityRateTypeChange).toHaveBeenCalledWith("inflation_only");
    expect(onTextChange).toHaveBeenCalledWith("customFirstPaymentDelayDays", "21");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("renderiza o resultado com estados premium e historico recente", () => {
    const onSelectedOptionChange = jest.fn();
    const onSave = jest.fn();
    const onCreateGoal = jest.fn();
    const onCreatePlannedExpense = jest.fn();

    const { getAllByText, getByText } = render(
      <AppProviders>
        <>
          <InstallmentVsCashResultCard
            calculation={buildCalculation()}
            selectedOption="installment"
            isSaving={false}
            isCreatingGoal={false}
            isCreatingPlannedExpense={false}
            hasPremiumAccess={false}
            onSelectedOptionChange={onSelectedOptionChange}
            onSave={onSave}
            onCreateGoal={onCreateGoal}
            onCreatePlannedExpense={onCreatePlannedExpense}
          />
          <InstallmentVsCashHistoryList items={[buildHistoryItem()]} />
        </>
      </AppProviders>,
    );

    expect(getAllByText("A vista e a melhor escolha").length).toBeGreaterThan(0);
    expect(getByText("Meta (Premium)")).toBeTruthy();
    expect(getByText("Despesa planejada (Premium)")).toBeTruthy();
    expect(getByText("Ultimas simulacoes salvas")).toBeTruthy();

    fireEvent.press(getByText("Salvar simulacao"));
    fireEvent.press(getByText("Meta (Premium)"));
    fireEvent.press(getByText("Despesa planejada (Premium)"));

    expect(onSelectedOptionChange).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCreateGoal).toHaveBeenCalledTimes(1);
    expect(onCreatePlannedExpense).toHaveBeenCalledTimes(1);
  });
});
