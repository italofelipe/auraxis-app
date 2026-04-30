import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateInssIr,
  createDefaultInssIrFormState,
  validateInssIrForm,
  type InssIrFormState,
  type InssIrResult,
} from "@/features/tools/services/calculators/inss-ir-folha";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<InssIrFormState, InssIrResult> = {
  toolId: "inss-ir-payroll",
  ruleVersion: "2026.04",
  createDefault: createDefaultInssIrFormState,
  validate: (form) =>
    validateInssIrForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateInssIr(form) as unknown as InssIrResult,
  buildMetadataLabel: (form) =>
    `INSS e IR · ${formatBrl(form.grossSalary ?? 0)} bruto`,
};

const FIELDS: readonly FieldDescriptor<InssIrFormState>[] = [
  { key: "grossSalary", label: "Salário bruto (R$)", type: "decimal" },
  {
    key: "dependents",
    label: "Dependentes IRRF",
    type: "integer",
    helperText: "0 quando não houver dependentes declarados.",
  },
  { key: "alimentPension", label: "Pensão alimentícia (R$)", type: "decimal" },
  { key: "privatePension", label: "Previdência privada PGBL (R$)", type: "decimal" },
];

/**
 * INSS/IRRF folha calculator screen — quanto sai por mês para cada tributo.
 * @returns The screen tree.
 */
export function InssIrPayrollScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="INSS e IR na folha"
      subtitle="Quanto sai da sua folha de pagamento por mês."
      testID="inss-ir-payroll-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "Salário líquido", value: formatBrl(result.netSalary) },
        { label: "INSS total", value: formatBrl(result.totalInss) },
        { label: "IRRF total", value: formatBrl(result.totalIrrf) },
        {
          label: "Carga tributária",
          value: `${result.effectiveRate.toFixed(2)}%`,
        },
      ]}
      resultDescription="Tabela 2025 — INSS e IRRF progressivos."
    />
  );
}
