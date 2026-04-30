import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  TESOURO_TYPES,
  calculateTesouroDireto,
  createDefaultTesouroDiretoFormState,
  validateTesouroDiretoForm,
  type TesouroDiretoFormState,
  type TesouroDiretoResult,
} from "@/features/tools/services/calculators/tesouro-direto";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import {
  formatBrl,
  formatRatePercent,
} from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<TesouroDiretoFormState, TesouroDiretoResult> = {
  toolId: "treasury",
  ruleVersion: "2026.04",
  createDefault: createDefaultTesouroDiretoFormState,
  validate: (form) =>
    validateTesouroDiretoForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) =>
    calculateTesouroDireto(form) as unknown as TesouroDiretoResult,
  buildMetadataLabel: (form) =>
    `Tesouro ${form.type} · ${formatBrl(form.amount ?? 0)} · ${form.termDays}d`,
};

const FIELDS: readonly FieldDescriptor<TesouroDiretoFormState>[] = [
  {
    key: "type",
    label: "Tipo de título",
    type: "text",
    helperText: `Use ${TESOURO_TYPES.join(", ")} (selic / ipca_plus / prefixado).`,
  },
  { key: "amount", label: "Valor investido (R$)", type: "decimal" },
  { key: "termDays", label: "Prazo (dias)", type: "integer", helperText: "Padrão 365 dias." },
  {
    key: "taxaIndicativaPct",
    label: "Taxa indicativa (% a.a.)",
    type: "decimal",
    helperText: "Selic: spread sobre Selic. IPCA+: spread sobre IPCA. Prefixado: taxa total.",
  },
  {
    key: "selicPct",
    label: "Selic atual (% a.a.)",
    type: "decimal",
    helperText: "Para títulos pós-fixados. Default 10,75%.",
  },
  {
    key: "ipcaPct",
    label: "IPCA estimado (% a.a.)",
    type: "decimal",
    helperText: "Para títulos atrelados ao IPCA. Default 4,5%.",
  },
];

export function TreasuryScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Tesouro Direto"
      subtitle="Selic, IPCA+ e prefixado com IR regressivo e taxa de custódia B3."
      testID="treasury-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "Líquido final", value: formatBrl(result.netAmount) },
        { label: "Rendimento líquido", value: formatBrl(result.netReturn) },
        { label: "Rendimento bruto", value: formatBrl(result.grossReturn) },
        { label: "IR retido", value: formatBrl(result.irAmount), hint: formatRatePercent(result.irRate) },
        { label: "Taxa B3 (custódia)", value: formatBrl(result.custodyFee) },
        {
          label: "Rentabilidade líquida (a.a.)",
          value: formatRatePercent(result.annualizedNetReturn),
        },
        {
          label: "Ganho real acima da inflação",
          value: formatRatePercent(result.realReturn),
        },
      ]}
      resultDescription="IR regressivo: até 180d=22,5% · 181-360=20% · 361-720=17,5% · acima 720=15%."
    />
  );
}
