import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateCltVsPj,
  createDefaultCltVsPjFormState,
  validateCltVsPjForm,
  type CltVsPjFormState,
  type CltVsPjResult,
} from "@/features/tools/services/calculators/clt-vs-pj";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<CltVsPjFormState, CltVsPjResult> = {
  toolId: "clt-vs-pj",
  ruleVersion: "2026.04",
  createDefault: createDefaultCltVsPjFormState,
  validate: (form) =>
    validateCltVsPjForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateCltVsPj(form) as unknown as CltVsPjResult,
  buildMetadataLabel: (form) =>
    `CLT vs PJ · CLT ${formatBrl(form.cltGrossSalary ?? 0)} · PJ ${formatBrl(form.pjMonthlyInvoice ?? 0)}`,
};

const FIELDS: readonly FieldDescriptor<CltVsPjFormState>[] = [
  { key: "cltGrossSalary", label: "Salário CLT bruto (R$)", type: "decimal" },
  { key: "cltVT", label: "VT mensal CLT (R$)", type: "decimal" },
  { key: "cltVR", label: "VR mensal CLT (R$)", type: "decimal" },
  { key: "cltHealthPlan", label: "Plano saúde CLT (R$)", type: "decimal" },
  { key: "pjMonthlyInvoice", label: "Faturamento PJ (R$/mês)", type: "decimal" },
  {
    key: "pjRegime",
    label: "Regime PJ",
    type: "text",
    helperText: "Use mei, simples_nacional ou lucro_presumido.",
  },
  { key: "pjFixedCosts", label: "Custos fixos PJ (R$/mês)", type: "decimal" },
  { key: "pjHealthPlan", label: "Plano saúde PJ (R$)", type: "decimal" },
];

/**
 * CLT vs PJ comparator screen — líquido e custo total nos dois regimes.
 * @returns The screen tree.
 */
export function CltVsPjScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="CLT vs PJ"
      subtitle="Compare líquido e benefícios entre os dois regimes."
      testID="clt-vs-pj-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "CLT líquido/mês", value: formatBrl(result.cltNetMonthly) },
        { label: "PJ líquido/mês", value: formatBrl(result.pjNetMonthly) },
        {
          label: "Diferença mensal",
          value: formatBrl(result.pjNetMonthly - result.cltNetMonthly),
        },
        {
          label: "Custo empregador CLT",
          value: formatBrl(result.cltEmployerTotalCost),
        },
      ]}
      resultDescription="Inclui FGTS, 13º proporcional, férias e o INSS PJ sobre prolabore."
    />
  );
}
