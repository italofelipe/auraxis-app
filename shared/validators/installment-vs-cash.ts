import type {
  InstallmentVsCashCalculation,
  OpportunityRateType,
  SelectedPaymentOption,
} from "@/types/contracts";
import type { InstallmentVsCashCalculationRequestDto } from "@/types/contracts/installment-vs-cash";

export const INSTALLMENT_VS_CASH_TOOL_ID = "installment_vs_cash";

export type InstallmentDelayPreset =
  | "today"
  | "30_days"
  | "45_days"
  | "custom";

export type InstallmentInputMode = "amount" | "total";

export interface InstallmentVsCashFormDraft {
  readonly scenarioLabel: string;
  readonly cashPrice: string;
  readonly installmentCount: string;
  readonly installmentInputMode: InstallmentInputMode;
  readonly installmentAmount: string;
  readonly installmentTotal: string;
  readonly firstPaymentDelayPreset: InstallmentDelayPreset;
  readonly customFirstPaymentDelayDays: string;
  readonly opportunityRateType: OpportunityRateType;
  readonly opportunityRateAnnual: string;
  readonly inflationRateAnnual: string;
  readonly feesEnabled: boolean;
  readonly feesUpfront: string;
}

export type InstallmentVsCashFormErrors = Partial<
  Record<keyof InstallmentVsCashFormDraft | "general", string>
>;

const parseOptionalNumber = (value: string): number | null => {
  const normalized = value.trim().replace(",", ".");
  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
};

const parseOptionalInteger = (value: string): number | null => {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) {
    return null;
  }

  return Math.trunc(parsed);
};

const toDecimalString = (value: number): string => {
  return value.toFixed(2);
};

export const createDefaultInstallmentVsCashFormDraft =
(): InstallmentVsCashFormDraft => ({
  scenarioLabel: "",
  cashPrice: "",
  installmentCount: "6",
  installmentInputMode: "total",
  installmentAmount: "",
  installmentTotal: "",
  firstPaymentDelayPreset: "30_days",
  customFirstPaymentDelayDays: "",
  opportunityRateType: "manual",
  opportunityRateAnnual: "12",
  inflationRateAnnual: "4.5",
  feesEnabled: false,
  feesUpfront: "",
});

export const resolveFirstPaymentDelayDays = (
  draft: InstallmentVsCashFormDraft,
): number => {
  if (draft.firstPaymentDelayPreset === "today") {
    return 0;
  }
  if (draft.firstPaymentDelayPreset === "30_days") {
    return 30;
  }
  if (draft.firstPaymentDelayPreset === "45_days") {
    return 45;
  }

  return Math.max(0, parseOptionalInteger(draft.customFirstPaymentDelayDays) ?? 0);
};

const validateCashPrice = (
  draft: InstallmentVsCashFormDraft,
  errors: InstallmentVsCashFormErrors,
): void => {
  const cashPrice = parseOptionalNumber(draft.cashPrice);
  if (cashPrice === null || cashPrice <= 0) {
    errors.cashPrice = "Informe um preco a vista maior que zero.";
  }
};

const validateInstallmentCount = (
  draft: InstallmentVsCashFormDraft,
  errors: InstallmentVsCashFormErrors,
): void => {
  const installmentCount = parseOptionalInteger(draft.installmentCount);
  if (installmentCount === null || installmentCount < 1) {
    errors.installmentCount = "Informe uma quantidade valida de parcelas.";
  }
};

const validateInstallmentValue = (
  draft: InstallmentVsCashFormDraft,
  errors: InstallmentVsCashFormErrors,
): void => {
  if (draft.installmentInputMode === "amount") {
    const installmentAmount = parseOptionalNumber(draft.installmentAmount);
    if (installmentAmount === null || installmentAmount <= 0) {
      errors.installmentAmount = "Informe o valor de cada parcela.";
    }
    return;
  }

  const installmentTotal = parseOptionalNumber(draft.installmentTotal);
  if (installmentTotal === null || installmentTotal <= 0) {
    errors.installmentTotal = "Informe o valor total do parcelamento.";
  }
};

const validateInflationRate = (
  draft: InstallmentVsCashFormDraft,
  errors: InstallmentVsCashFormErrors,
): void => {
  const inflationRateAnnual = parseOptionalNumber(draft.inflationRateAnnual);
  if (inflationRateAnnual === null || inflationRateAnnual < 0) {
    errors.inflationRateAnnual = "Informe a inflacao anual usada na simulacao.";
  }
};

const validateOpportunityRate = (
  draft: InstallmentVsCashFormDraft,
  errors: InstallmentVsCashFormErrors,
): void => {
  if (draft.opportunityRateType !== "manual") {
    return;
  }

  const opportunityRateAnnual = parseOptionalNumber(draft.opportunityRateAnnual);
  if (opportunityRateAnnual === null || opportunityRateAnnual < 0) {
    errors.opportunityRateAnnual = "Informe a taxa de oportunidade anual.";
  }
};

const validateCustomDelay = (
  draft: InstallmentVsCashFormDraft,
  errors: InstallmentVsCashFormErrors,
): void => {
  if (draft.firstPaymentDelayPreset !== "custom") {
    return;
  }

  const customDelay = parseOptionalInteger(draft.customFirstPaymentDelayDays);
  if (customDelay === null || customDelay < 0) {
    errors.customFirstPaymentDelayDays =
      "Informe em quantos dias a primeira parcela vence.";
  }
};

const validateFees = (
  draft: InstallmentVsCashFormDraft,
  errors: InstallmentVsCashFormErrors,
): void => {
  if (!draft.feesEnabled) {
    return;
  }

  const feesUpfront = parseOptionalNumber(draft.feesUpfront);
  if (feesUpfront === null || feesUpfront < 0) {
    errors.feesUpfront = "Informe os custos extras iniciais.";
  }
};

export const validateInstallmentVsCashDraft = (
  draft: InstallmentVsCashFormDraft,
): InstallmentVsCashFormErrors => {
  const errors: InstallmentVsCashFormErrors = {};
  validateCashPrice(draft, errors);
  validateInstallmentCount(draft, errors);
  validateInstallmentValue(draft, errors);
  validateInflationRate(draft, errors);
  validateOpportunityRate(draft, errors);
  validateCustomDelay(draft, errors);
  validateFees(draft, errors);

  return errors;
};

const buildBasePayload = (
  draft: InstallmentVsCashFormDraft,
): InstallmentVsCashCalculationRequestDto => ({
  cash_price: toDecimalString(parseOptionalNumber(draft.cashPrice) ?? 0),
  installment_count: parseOptionalInteger(draft.installmentCount) ?? 0,
  inflation_rate_annual: toDecimalString(
    parseOptionalNumber(draft.inflationRateAnnual) ?? 0,
  ),
  fees_enabled: draft.feesEnabled,
  fees_upfront: toDecimalString(parseOptionalNumber(draft.feesUpfront) ?? 0),
  first_payment_delay_days: resolveFirstPaymentDelayDays(draft),
  opportunity_rate_type: draft.opportunityRateType,
});

const buildInstallmentPayload = (
  draft: InstallmentVsCashFormDraft,
): Partial<InstallmentVsCashCalculationRequestDto> => {
  if (draft.installmentInputMode === "amount") {
    return {
      installment_amount: toDecimalString(
        parseOptionalNumber(draft.installmentAmount) ?? 0,
      ),
    };
  }

  return {
    installment_total: toDecimalString(
      parseOptionalNumber(draft.installmentTotal) ?? 0,
    ),
  };
};

const buildOpportunityPayload = (
  draft: InstallmentVsCashFormDraft,
): Partial<InstallmentVsCashCalculationRequestDto> => {
  if (draft.opportunityRateType !== "manual") {
    return {};
  }

  return {
    opportunity_rate_annual: toDecimalString(
      parseOptionalNumber(draft.opportunityRateAnnual) ?? 0,
    ),
  };
};

const buildScenarioPayload = (
  draft: InstallmentVsCashFormDraft,
): Partial<InstallmentVsCashCalculationRequestDto> => {
  const scenarioLabel = draft.scenarioLabel.trim();
  return scenarioLabel.length > 0 ? { scenario_label: scenarioLabel } : {};
};

export const toInstallmentVsCashCalculationRequest = (
  draft: InstallmentVsCashFormDraft,
): InstallmentVsCashCalculationRequestDto => {
  return {
    ...buildBasePayload(draft),
    ...buildInstallmentPayload(draft),
    ...buildOpportunityPayload(draft),
    ...buildScenarioPayload(draft),
  };
};

export const getRecommendationLabel = (
  option: InstallmentVsCashCalculation["result"]["recommendedOption"],
): string => {
  if (option === "cash") {
    return "A vista e a melhor escolha";
  }
  if (option === "installment") {
    return "Parcelado e a melhor escolha";
  }

  return "As opcoes ficaram praticamente empatadas";
};

export const getSuggestedSelectedOption = (
  calculation: InstallmentVsCashCalculation,
): SelectedPaymentOption => {
  return calculation.result.recommendedOption === "installment"
    ? "installment"
    : "cash";
};
