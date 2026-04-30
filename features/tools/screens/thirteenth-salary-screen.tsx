import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateThirteenthSalary,
  createDefaultThirteenthSalaryFormState,
  validateThirteenthSalaryForm,
  type ThirteenthSalaryFormState,
  type ThirteenthSalaryResult,
} from "@/features/tools/services/calculators/thirteenth-salary";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<ThirteenthSalaryFormState, ThirteenthSalaryResult> = {
  toolId: "thirteenth-salary",
  ruleVersion: "2026.04",
  createDefault: createDefaultThirteenthSalaryFormState,
  validate: (form) =>
    validateThirteenthSalaryForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) =>
    calculateThirteenthSalary(form) as unknown as ThirteenthSalaryResult,
  buildMetadataLabel: (form) =>
    `13º · ${form.monthsWorked} meses · ${formatBrl(form.grossSalary ?? 0)}`,
};

const FIELDS: readonly FieldDescriptor<ThirteenthSalaryFormState>[] = [
  { key: "grossSalary", label: "Salário bruto mensal (R$)", type: "decimal" },
  {
    key: "monthsWorked",
    label: "Meses trabalhados no ano (1–12)",
    type: "integer",
  },
  {
    key: "variablePay",
    label: "Média de variáveis (R$)",
    type: "decimal",
    helperText: "Comissões, horas extras, adicional noturno, etc.",
  },
  {
    key: "advancePaid",
    label: "Antecipação já paga (R$)",
    type: "decimal",
    helperText: "Use 0 quando ainda não houve adiantamento.",
  },
  {
    key: "dependents",
    label: "Dependentes IRRF",
    type: "integer",
  },
];

/**
 * 13º salário calculator screen — duas parcelas e total líquido.
 * @returns The screen tree.
 */
export function ThirteenthSalaryScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="13º salário"
      subtitle="Estime as duas parcelas e o valor total no fim do ano."
      testID="thirteenth-salary-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "13º bruto", value: formatBrl(result.totalGross) },
        { label: "INSS", value: formatBrl(result.totalInss) },
        { label: "IRRF", value: formatBrl(result.totalIrrf) },
        { label: "Líquido total", value: formatBrl(result.totalNet) },
        {
          label: "1ª parcela (até 30/nov)",
          value: formatBrl(result.firstInstallment.net),
        },
        {
          label: "2ª parcela (até 20/dez)",
          value: formatBrl(result.secondInstallment.net),
        },
      ]}
      resultDescription="A 1ª parcela não tem desconto de INSS/IRRF; ambos são cobrados na 2ª."
    />
  );
}
