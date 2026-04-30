import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  PROFILE_OPTIONS,
  calculateReservaEmergencia,
  createDefaultReservaEmergenciaFormState,
  validateReservaEmergenciaForm,
  type ReservaEmergenciaFormState,
  type ReservaEmergenciaResult,
} from "@/features/tools/services/calculators/reserva-emergencia";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import {
  formatBrl,
  formatPercent,
} from "@/features/tools/services/calculator-formatters";

const PROFILE_HELPER = PROFILE_OPTIONS.map(
  (p) => `${p.value} (${p.months}m)`,
).join(", ");

const SPEC: CalculatorSpec<ReservaEmergenciaFormState, ReservaEmergenciaResult> = {
  toolId: "emergency-fund",
  ruleVersion: "2026.04",
  createDefault: createDefaultReservaEmergenciaFormState,
  validate: (form) =>
    validateReservaEmergenciaForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) =>
    calculateReservaEmergencia(form) as unknown as ReservaEmergenciaResult,
  buildMetadataLabel: (form, result) =>
    `Reserva ${form.profile} · ${formatBrl(result.targetAmount)}`,
};

const FIELDS: readonly FieldDescriptor<ReservaEmergenciaFormState>[] = [
  {
    key: "monthlyExpenses",
    label: "Gastos mensais (R$)",
    type: "decimal",
    helperText: "Soma dos seus custos fixos mais variáveis essenciais.",
  },
  {
    key: "profile",
    label: "Perfil profissional",
    type: "text",
    helperText: PROFILE_HELPER,
  },
  {
    key: "currentReserve",
    label: "Reserva atual (R$)",
    type: "decimal",
    helperText: "Quanto você já tem guardado.",
  },
  {
    key: "monthlyContribution",
    label: "Aporte mensal (R$)",
    type: "decimal",
    helperText: "Quanto consegue guardar por mês.",
  },
  {
    key: "annualReturnPct",
    label: "Rentabilidade anual estimada (%)",
    type: "decimal",
    helperText: "Padrão 12,25% — Selic líquida estimada.",
  },
];

/**
 * Reserva de emergência calculator screen.
 * @returns The screen tree.
 */
export function EmergencyFundScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Reserva de emergência"
      subtitle="Quanto você precisa, em quantos meses, e como diferentes investimentos chegam lá."
      testID="emergency-fund-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => {
        const top = result.investments[0];
        return [
          { label: "Reserva alvo", value: formatBrl(result.targetAmount) },
          { label: "Meses do perfil", value: `${result.profileMonths} meses` },
          { label: "Falta acumular", value: formatBrl(result.gap) },
          {
            label: "Tempo até a meta (sua taxa)",
            value:
              result.monthsToTarget === 0
                ? "Já alcançada"
                : `${result.monthsToTarget} meses`,
          },
          ...(top !== undefined
            ? [
                {
                  label: `Mais rápido (${top.name})`,
                  value:
                    top.monthsToTarget === 0
                      ? "Já alcançada"
                      : `${top.monthsToTarget} meses · ${formatPercent(top.annualRatePct)}`,
                },
              ]
            : []),
        ];
      }}
      resultDescription="Comparativo com Selic, CDB 100% CDI, Fundo DI e Poupança."
    />
  );
}
