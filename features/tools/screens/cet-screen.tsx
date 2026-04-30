import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateCet,
  createDefaultCetFormState,
  validateCetForm,
  type CetFormState,
  type CetResult,
} from "@/features/tools/services/calculators/cet";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import {
  formatBrl,
  formatPercent,
} from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<CetFormState, CetResult> = {
  toolId: "cet-calculator",
  ruleVersion: "2026.04",
  createDefault: createDefaultCetFormState,
  validate: (form) =>
    validateCetForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => {
    const result = calculateCet(form);
    if (result === null) {
      throw new Error("CET could not converge with the provided parameters.");
    }
    return result as unknown as CetResult;
  },
  buildMetadataLabel: (form) =>
    `CET ${formatBrl(form.loanAmount ?? 0)} · ${form.termMonths} meses`,
};

const FIELDS: readonly FieldDescriptor<CetFormState>[] = [
  { key: "loanAmount", label: "Valor solicitado (R$)", type: "decimal" },
  {
    key: "nominalMonthlyRatePct",
    label: "Taxa nominal mensal (%)",
    type: "decimal",
    helperText: "Taxa de juros mensal anunciada pelo banco.",
  },
  { key: "termMonths", label: "Prazo (meses)", type: "integer" },
  { key: "tacAmount", label: "TAC (R$)", type: "decimal", helperText: "Tarifa de abertura do contrato." },
  { key: "insuranceMonthly", label: "Seguro mensal (R$)", type: "decimal" },
  { key: "appraisalFee", label: "Tarifa de avaliação (R$)", type: "decimal" },
  {
    key: "iofOverride",
    label: "IOF (R$, opcional)",
    type: "decimal",
    helperText: "Vazio para calcular automaticamente pelas regras do Bacen.",
  },
];

export function CetScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="CET — Custo Efetivo Total"
      subtitle="Compare ofertas de empréstimo pelo CET, não pela taxa nominal."
      testID="cet-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "CET mensal", value: formatPercent(result.cetMonthlyPct) },
        { label: "CET anual", value: formatPercent(result.cetAnnualPct) },
        { label: "Taxa nominal anual", value: formatPercent(result.nominalAnnualPct) },
        { label: "Parcela mensal", value: formatBrl(result.monthlyPayment) },
        { label: "Total pago", value: formatBrl(result.totalPaid) },
        { label: "IOF", value: formatBrl(result.iofAmount) },
        { label: "Líquido recebido", value: formatBrl(result.netAmountReceived) },
        { label: "Custo total da operação", value: formatBrl(result.totalCost) },
      ]}
      resultDescription="CET inclui IOF, TAC, seguros e tarifas — é o custo verdadeiro do empréstimo."
    />
  );
}
