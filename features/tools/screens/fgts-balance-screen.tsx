import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  FGTS_TERMINATION_TYPES,
  calculateFgts,
  createDefaultFgtsFormState,
  validateFgtsForm,
  type FgtsFormState,
  type FgtsResult,
} from "@/features/tools/services/calculators/fgts";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<FgtsFormState, FgtsResult> = {
  toolId: "fgts-balance",
  ruleVersion: "2026.04",
  createDefault: createDefaultFgtsFormState,
  validate: (form) =>
    validateFgtsForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateFgts(form) as unknown as FgtsResult,
  buildMetadataLabel: (form) =>
    `FGTS ${formatBrl(form.grossSalary ?? 0)}/mês · ${form.terminationType}`,
};

const FIELDS: readonly FieldDescriptor<FgtsFormState>[] = [
  { key: "grossSalary", label: "Salário bruto mensal (R$)", type: "decimal" },
  { key: "yearsOfService", label: "Anos de serviço", type: "integer" },
  {
    key: "monthsOfService",
    label: "Meses adicionais",
    type: "integer",
    helperText: "Entre 0 e 11 — meses além dos anos cheios.",
  },
  {
    key: "currentBalance",
    label: "Saldo FGTS atual (R$)",
    type: "decimal",
    helperText: "Use 0 para projetar do zero. Confira no app FGTS.",
  },
  {
    key: "trRatePct",
    label: "TR anual (%)",
    type: "decimal",
    helperText: "Taxa Referencial. Atualmente próxima de 0%.",
  },
  {
    key: "terminationType",
    label: "Tipo de término",
    type: "text",
    helperText: `Use ${FGTS_TERMINATION_TYPES.join(", ")} — sem_justa_causa libera saque + 40%.`,
  },
];

export function FgtsBalanceScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="FGTS"
      subtitle="Projeção do saldo, multas rescisórias e o quanto você pode sacar."
      testID="fgts-balance-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        { label: "Saldo projetado", value: formatBrl(result.projectedBalance) },
        { label: "Depósito mensal (8%)", value: formatBrl(result.monthlyDeposit) },
        { label: "Total depositado", value: formatBrl(result.totalDeposited) },
        { label: "Correção monetária", value: formatBrl(result.correctionAmount) },
        { label: "Multa rescisória (40% / 20%)", value: formatBrl(result.fineAmount) },
        { label: "Multa fiscal (10%)", value: formatBrl(result.governmentFineAmount) },
        {
          label: "Você pode sacar?",
          value: result.canWithdraw ? "Sim" : "Não — só em casos específicos",
        },
        { label: "Total sacável", value: formatBrl(result.withdrawableAmount) },
      ]}
      resultDescription="8% sobre salário, sem teto. Multa rescisória só em demissão sem justa causa ou acordo."
    />
  );
}
