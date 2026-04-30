import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateMei,
  createDefaultMeiFormState,
  validateMeiForm,
  type MeiFormState,
  type MeiResult,
} from "@/features/tools/services/calculators/mei";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<MeiFormState, MeiResult> = {
  toolId: "mei-monthly",
  ruleVersion: "2026.04",
  createDefault: createDefaultMeiFormState,
  validate: (form) =>
    validateMeiForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateMei(form) as unknown as MeiResult,
  buildMetadataLabel: (form) =>
    `MEI · ${form.activity} · ${formatBrl(form.monthlyRevenue ?? 0)}/mês`,
};

const FIELDS: readonly FieldDescriptor<MeiFormState>[] = [
  {
    key: "activity",
    label: "Atividade",
    type: "text",
    helperText: "Use comercio, servicos ou ambos.",
  },
  {
    key: "monthlyRevenue",
    label: "Faturamento mensal (R$)",
    type: "decimal",
    helperText: "Limite anual MEI: R$ 81.000.",
  },
];

/**
 * MEI monthly calculator screen — DAS, faturamento e enquadramento.
 * @returns The screen tree.
 */
export function MeiMonthlyScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="MEI mensal"
      subtitle="DAS, faturamento e enquadramento simplificado."
      testID="mei-monthly-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "DAS mensal", value: formatBrl(result.dasMontly) },
        { label: "DAS anual", value: formatBrl(result.dasAnnual) },
        {
          label: "Faturamento anual projetado",
          value: formatBrl(result.annualRevenueProjection),
        },
        {
          label: "Limite MEI",
          value: result.isWithinLimit ? "Dentro do limite" : "Acima do limite",
        },
      ]}
      resultDescription="DAS calculado pela atividade declarada (tabela 2025)."
    />
  );
}
