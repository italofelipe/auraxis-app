import type { ReactElement } from "react";

import {
  CalculatorScreen,
} from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorMetric } from "@/features/tools/components/calculator-result-card";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";
import {
  calculateRegionalCost,
  createDefaultRegionalCostFormState,
  validateRegionalCostForm,
  type RegionalCostFormState,
  type RegionalCostResult,
} from "@/features/tools/services/calculators/custo-de-vida-regional";

const TOOL_ID = "regional-cost-of-living";
const RULE_VERSION = "2026.06";

const percent = (value: number): string => `${value.toFixed(2)}%`;

const regionalCostSpec: CalculatorSpec<RegionalCostFormState, RegionalCostResult> = {
  toolId: TOOL_ID,
  ruleVersion: RULE_VERSION,
  createDefault: createDefaultRegionalCostFormState,
  validate: (form) =>
    validateRegionalCostForm(form).map((error) => ({
      field: error.field as keyof RegionalCostFormState,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: calculateRegionalCost,
  buildMetadataLabel: (form, result) =>
    `Custo regional · ${form.uf.toUpperCase()} · ${formatBrl(result.totalMonthlyCost)}/mes`,
};

const regionalCostFields: readonly FieldDescriptor<RegionalCostFormState>[] = [
  {
    key: "uf",
    label: "UF",
    type: "text",
    placeholder: "SP",
    helperText: "Use a sigla do estado, como SP, RJ, MG ou DF.",
  },
  {
    key: "monthlyIncome",
    label: "Renda mensal líquida (R$)",
    type: "decimal",
    placeholder: "10000",
  },
  { key: "housing", label: "Moradia (R$)", type: "decimal", placeholder: "2500" },
  { key: "transport", label: "Transporte (R$)", type: "decimal", placeholder: "800" },
  { key: "food", label: "Alimentação (R$)", type: "decimal", placeholder: "1500" },
  { key: "leisure", label: "Lazer (R$)", type: "decimal", placeholder: "700" },
  { key: "other", label: "Outros (R$)", type: "decimal", placeholder: "500" },
];

const buildRegionalMetrics = (
  _form: RegionalCostFormState,
  result: RegionalCostResult,
): readonly CalculatorMetric[] => [
  { label: "Custo mensal", value: formatBrl(result.totalMonthlyCost) },
  { label: "Custo anual", value: formatBrl(result.totalAnnualCost) },
  { label: "Renda comprometida", value: percent(result.committedPct) },
  { label: "Taxa de poupança", value: percent(result.savingsRatePct) },
  { label: "Economia mensal", value: formatBrl(result.monthlySavings) },
  { label: "Score de sustentabilidade", value: `${result.sustainabilityScore}/100` },
  { label: "Patrimônio alvo", value: formatBrl(result.targetWealth) },
  {
    label: "Anos até FIRE",
    value: result.yearsToRetirement === null ? "Sem poupança" : `${result.yearsToRetirement} anos`,
  },
  {
    label: "Comparação regional",
    value: `${result.regional.uf} · ${result.regional.name}`,
    hint: `${percent(result.regional.costVsRegionalPct)} vs custo médio`,
  },
];

const buildRegionalFooter = (
  _form: RegionalCostFormState,
  result: RegionalCostResult,
): string =>
  `Referência ${result.regional.name}: custo médio ${formatBrl(
    result.regional.avgCost,
  )} e renda média ${formatBrl(result.regional.avgIncome)}.`;

export function RegionalCostOfLivingScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Custo de vida regional"
      subtitle="Compare seu custo mensal com médias por UF e veja sua sustentabilidade."
      testID="regional-cost-of-living-screen"
      spec={regionalCostSpec}
      fields={regionalCostFields}
      buildMetrics={buildRegionalMetrics}
      resultTitle="Diagnóstico regional"
      resultDescription="Custos, renda comprometida, referência estadual e meta FIRE."
      resultFooter={buildRegionalFooter}
      formCardTitle="Informe sua realidade mensal"
      formCardDescription="Separe os gastos por categoria para enxergar onde seu padrão pesa."
    />
  );
}
