import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateHoraExtra,
  createDefaultHoraExtraFormState,
  validateHoraExtraForm,
  type HoraExtraFormState,
  type HoraExtraResult,
} from "@/features/tools/services/calculators/hora-extra";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<HoraExtraFormState, HoraExtraResult> = {
  toolId: "overtime",
  ruleVersion: "2026.04",
  createDefault: createDefaultHoraExtraFormState,
  validate: (form) =>
    validateHoraExtraForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateHoraExtra(form) as unknown as HoraExtraResult,
  buildMetadataLabel: (form) => {
    const total = form.hours50 + form.hours75 + form.hours100;
    return `Hora extra · ${total}h sobre ${formatBrl(form.grossSalary ?? 0)}`;
  },
};

const FIELDS: readonly FieldDescriptor<HoraExtraFormState>[] = [
  { key: "grossSalary", label: "Salário bruto mensal (R$)", type: "decimal" },
  {
    key: "hoursPerMonth",
    label: "Carga mensal padrão (horas)",
    type: "integer",
    helperText: "Padrão CLT é 220h.",
  },
  { key: "hours50", label: "Horas extras a 50%", type: "decimal" },
  { key: "hours75", label: "Horas extras a 75%", type: "decimal" },
  { key: "hours100", label: "Horas extras a 100%", type: "decimal" },
];

/**
 * Hora extra calculator screen — adicional 50/75/100% sobre o salário base.
 * @returns The screen tree.
 */
export function OvertimeScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Hora extra"
      subtitle="Cálculo com adicional de 50%, 75% e 100% conforme a CLT."
      testID="overtime-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => [
        {
          label: "Total bruto",
          value: formatBrl(result.totalOvertimeGross),
        },
        {
          label: "Líquido estimado",
          value: formatBrl(result.netOvertimeEstimate),
        },
        {
          label: "Valor da hora",
          value: formatBrl(result.hourlyRate),
        },
        {
          label: "Total de horas",
          value: `${result.totalOvertimeHours}h`,
        },
      ]}
      resultDescription="Inclui o impacto de INSS proporcional sobre o adicional."
    />
  );
}
