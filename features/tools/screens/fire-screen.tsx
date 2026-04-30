import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  FIRE_VARIANTS,
  calculateFire,
  createDefaultFireFormState,
  validateFireForm,
  type FireFormState,
  type FireResult,
} from "@/features/tools/services/calculators/fire";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import {
  formatBrl,
  formatPercent,
} from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<FireFormState, FireResult> = {
  toolId: "fire",
  ruleVersion: "2026.04",
  createDefault: createDefaultFireFormState,
  validate: (form) =>
    validateFireForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateFire(form) as unknown as FireResult,
  buildMetadataLabel: (form) =>
    `${form.variant.toUpperCase()} · ${form.currentAge}→${form.retirementAge}`,
};

const FIELDS: readonly FieldDescriptor<FireFormState>[] = [
  { key: "currentAge", label: "Idade atual", type: "integer" },
  { key: "retirementAge", label: "Idade-alvo de aposentadoria", type: "integer" },
  { key: "monthlyExpenses", label: "Gastos mensais hoje (R$)", type: "decimal" },
  { key: "currentPatrimony", label: "Patrimônio atual (R$)", type: "decimal" },
  {
    key: "expectedReturnPct",
    label: "Rentabilidade esperada (% a.a.)",
    type: "decimal",
    helperText: "Padrão 8% — retorno nominal de carteira diversificada.",
  },
  {
    key: "ipcaPct",
    label: "IPCA estimado (% a.a.)",
    type: "decimal",
    helperText: "Padrão 4,5%. Usado para calcular o ganho real.",
  },
  {
    key: "variant",
    label: "Variante FIRE",
    type: "text",
    helperText: `Use ${FIRE_VARIANTS.join(", ")}. fire=25x, lean=20x, fat=33x, coast=acumular hoje, parar aporte.`,
  },
];

export function FireScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="FIRE"
      subtitle="Quando seu patrimônio passa a sustentar seu custo de vida."
      testID="fire-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(form, result) => [
        {
          label: `Patrimônio-alvo (${form.variant})`,
          value: formatBrl(result.selectedVariant.requiredPatrimony),
        },
        {
          label: "Aporte mensal necessário",
          value: formatBrl(result.selectedVariant.requiredMonthlyContribution),
        },
        {
          label: "Trajetória atual",
          value: result.selectedVariant.isOnTrack ? "Atingirá o alvo" : "Aporte abaixo do necessário",
        },
        {
          label: "Patrimônio projetado aos " + form.retirementAge,
          value: formatBrl(result.projectedPatrimony),
        },
        { label: "Coast FIRE — lump sum hoje", value: formatBrl(result.coastNumber) },
        { label: "Ganho real anual", value: formatPercent(result.realReturnPct) },
        {
          label: "Meses até a meta",
          value: `${result.monthsToRetirement} meses`,
        },
      ]}
      resultDescription="O cálculo usa Fisher (juros − inflação) para o ganho real e SWR conforme a variante."
    />
  );
}
