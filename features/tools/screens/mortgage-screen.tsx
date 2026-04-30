import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateFinanciamento,
  createDefaultFinanciamentoFormState,
  validateFinanciamentoForm,
  type FinanciamentoFormState,
  type FinanciamentoResult,
} from "@/features/tools/services/calculators/financiamento-imobiliario";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import {
  formatBrl,
  formatPercent,
} from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<FinanciamentoFormState, FinanciamentoResult> = {
  toolId: "mortgage",
  ruleVersion: "2026.04",
  createDefault: createDefaultFinanciamentoFormState,
  validate: (form) =>
    validateFinanciamentoForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) =>
    calculateFinanciamento(form) as unknown as FinanciamentoResult,
  buildMetadataLabel: (form) =>
    `Imóvel ${formatBrl(form.propertyValue ?? 0)} · ${form.termMonths} meses`,
};

const FIELDS: readonly FieldDescriptor<FinanciamentoFormState>[] = [
  { key: "propertyValue", label: "Valor do imóvel (R$)", type: "decimal" },
  {
    key: "downPaymentPct",
    label: "Entrada (%)",
    type: "decimal",
    helperText: "Padrão 20%. Caixa exige no mínimo 10%.",
  },
  {
    key: "termMonths",
    label: "Prazo (meses)",
    type: "integer",
    helperText: "Padrão 360 meses (30 anos), máximo 360.",
  },
  {
    key: "annualRatePct",
    label: "Taxa anual (%)",
    type: "decimal",
    helperText: "Taxa nominal anual da Caixa, BB ou banco privado.",
  },
  { key: "insuranceMonthly", label: "Seguro mensal (R$)", type: "decimal" },
  { key: "adminFeeMonthly", label: "Tarifa admin. mensal (R$)", type: "decimal" },
];

export function MortgageScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Financiamento imobiliário"
      subtitle="Compare SAC e PRICE para o seu imóvel — primeira parcela, total pago e CET."
      testID="mortgage-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "Entrada", value: formatBrl(result.downPayment) },
        { label: "Valor financiado", value: formatBrl(result.loanAmount) },
        { label: "SAC — 1ª parcela", value: formatBrl(result.sac.firstPayment) },
        { label: "SAC — última parcela", value: formatBrl(result.sac.lastPayment) },
        { label: "SAC — total pago", value: formatBrl(result.sac.totalPaid) },
        { label: "PRICE — parcela fixa", value: formatBrl(result.price.firstPayment) },
        { label: "PRICE — total pago", value: formatBrl(result.price.totalPaid) },
        { label: "CET estimado (a.a.)", value: formatPercent(result.cetEstimatedPct) },
      ]}
      resultDescription="SAC: parcelas decrescentes, total menor. PRICE: parcelas fixas, total maior."
    />
  );
}
