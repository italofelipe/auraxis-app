import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateSalarioLiquido,
  createDefaultSalarioLiquidoFormState,
  validateSalarioLiquidoForm,
  type SalarioLiquidoFormState,
  type SalarioLiquidoResult,
} from "@/features/tools/services/calculators/salario-liquido";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const TOOL_ID = "salary-net-clt";

const SPEC: CalculatorSpec<SalarioLiquidoFormState, SalarioLiquidoResult> = {
  toolId: TOOL_ID,
  ruleVersion: "2026.04",
  createDefault: createDefaultSalarioLiquidoFormState,
  validate: (form) =>
    validateSalarioLiquidoForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateSalarioLiquido(form) as unknown as SalarioLiquidoResult,
  buildMetadataLabel: (form) =>
    `Salário líquido CLT · ${formatBrl(form.grossSalary ?? 0)} bruto`,
};

const FIELDS: readonly FieldDescriptor<SalarioLiquidoFormState>[] = [
  { key: "grossSalary", label: "Salário bruto (R$)", type: "decimal" },
  {
    key: "dependents",
    label: "Dependentes IRRF",
    type: "integer",
    helperText: "0 quando não houver dependentes declarados.",
  },
  {
    key: "alimonyPct",
    label: "Pensão alimentícia (% do bruto)",
    type: "decimal",
    helperText: "Use 0 se não houver pensão.",
  },
  {
    key: "vtPct",
    label: "Vale-transporte (% do bruto, máx. 6)",
    type: "decimal",
    helperText: "Padrão CLT é 6%; informe 0 se optou por sair.",
  },
  { key: "vaVrDiscount", label: "VA/VR descontado (R$)", type: "decimal" },
  { key: "healthPlanDiscount", label: "Plano de saúde mensal (R$)", type: "decimal" },
  { key: "pgblPct", label: "PGBL (% do bruto, dedutível)", type: "decimal" },
];

/**
 * Salário líquido CLT calculator screen — descontos INSS, IRRF, VT, VA/VR,
 * plano de saúde, sindical e pensão alimentícia.
 * @returns The screen tree.
 */
export function SalaryNetCltScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Salário líquido CLT"
      subtitle="Quanto você recebe descontando INSS, IR e benefícios."
      testID="salary-net-clt-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "Salário líquido", value: formatBrl(result.netSalary) },
        { label: "INSS", value: formatBrl(result.inss) },
        { label: "IRRF", value: formatBrl(result.irrf) },
        { label: "Total descontos", value: formatBrl(result.totalDeductions) },
      ]}
      resultTitle="Resultado"
      resultDescription="Tabela 2025 — INSS e IRRF progressivos."
    />
  );
}
