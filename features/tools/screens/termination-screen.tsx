import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateRescisao,
  createDefaultRescisaoFormState,
  validateRescisaoForm,
  type RescisaoFormState,
  type RescisaoResult,
} from "@/features/tools/services/calculators/rescisao";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<RescisaoFormState, RescisaoResult> = {
  toolId: "termination",
  ruleVersion: "2026.04",
  createDefault: createDefaultRescisaoFormState,
  validate: (form) =>
    validateRescisaoForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateRescisao(form) as unknown as RescisaoResult,
  buildMetadataLabel: (form) =>
    `Rescisão · ${form.terminationType} · ${formatBrl(form.grossSalary ?? 0)}`,
};

const FIELDS: readonly FieldDescriptor<RescisaoFormState>[] = [
  { key: "grossSalary", label: "Salário bruto (R$)", type: "decimal" },
  {
    key: "terminationType",
    label: "Tipo de rescisão",
    type: "text",
    helperText:
      "sem_justa_causa, com_justa_causa, pedido_de_demissao ou acordo.",
  },
  { key: "yearsOfService", label: "Anos de serviço completos", type: "integer" },
  {
    key: "daysWorkedInLastMonth",
    label: "Dias trabalhados no último mês (0–30)",
    type: "integer",
  },
  { key: "monthsFor13", label: "Meses para o 13º (0–12)", type: "integer" },
  { key: "monthsForVacation", label: "Meses para férias (0–12)", type: "integer" },
  { key: "overtimeAverage", label: "Média mensal de horas extras (R$)", type: "decimal" },
  { key: "dependents", label: "Dependentes IRRF", type: "integer" },
  { key: "fgtsBalance", label: "Saldo do FGTS (R$)", type: "decimal" },
];

/**
 * Rescisão calculator screen — verbas rescisórias para cada tipo de saída.
 * @returns The screen tree.
 */
export function TerminationScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Rescisão"
      subtitle="Direitos por demissão sem justa causa, pedido ou acordo."
      testID="termination-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "Total bruto", value: formatBrl(result.totalGross) },
        { label: "Líquido a receber", value: formatBrl(result.netTotal) },
        { label: "Saldo de salário", value: formatBrl(result.saldoSalario) },
        { label: "Aviso prévio", value: formatBrl(result.avisoPrevio) },
        { label: "Multa do FGTS", value: formatBrl(result.fgtsMulta) },
        { label: "INSS", value: formatBrl(result.inss) },
        { label: "IRRF", value: formatBrl(result.irrf) },
      ]}
      resultDescription="Calculado conforme tabela 2025 do MTE/Receita."
    />
  );
}
