import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import {
  formatBrl,
  formatPercent,
} from "@/features/tools/services/calculator-formatters";
import {
  calculateAposentadoria,
  createDefaultAposentadoriaFormState,
  validateAposentadoriaForm,
  type AposentadoriaFormState,
  type AposentadoriaResult,
} from "@/features/tools/services/calculators/aposentadoria";

const SPEC: CalculatorSpec<AposentadoriaFormState, AposentadoriaResult> = {
  toolId: "aposentadoria",
  ruleVersion: "2026.04",
  createDefault: createDefaultAposentadoriaFormState,
  validate: (form) =>
    validateAposentadoriaForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateAposentadoria(form) as unknown as AposentadoriaResult,
  buildMetadataLabel: (form) =>
    `Aposentadoria · ${form.currentAge}→${form.retirementAge}`,
};

const FIELDS: readonly FieldDescriptor<AposentadoriaFormState>[] = [
  { key: "currentAge", label: "Idade atual", type: "integer" },
  {
    key: "retirementAge",
    label: "Idade-alvo de aposentadoria",
    type: "integer",
  },
  {
    key: "desiredMonthlyIncome",
    label: "Renda mensal desejada (R$)",
    type: "decimal",
    helperText: "Em valores de hoje. Usa-se a regra dos 25x para o patrimonio alvo.",
  },
  {
    key: "currentPatrimony",
    label: "Patrimonio atual (R$)",
    type: "decimal",
  },
  {
    key: "expectedReturnPct",
    label: "Rentabilidade esperada (% a.a.)",
    type: "decimal",
    helperText: "Padrao 8% — retorno nominal de carteira diversificada.",
  },
  {
    key: "ipcaPct",
    label: "IPCA estimado (% a.a.)",
    type: "decimal",
    helperText: "Padrao 4,5%. Usado para calcular o ganho real.",
  },
  {
    key: "lifeExpectancy",
    label: "Expectativa de vida (anos)",
    type: "integer",
    helperText: "Sanity check: tem que ser maior que a idade alvo.",
  },
];

export function AposentadoriaScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Aposentadoria"
      subtitle="Quanto guardar por mes para se aposentar com a renda desejada."
      testID="aposentadoria-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_form, result) => [
        {
          label: "Patrimonio alvo (regra dos 25x)",
          value: formatBrl(result.requiredPatrimony),
        },
        {
          label: "Aporte mensal necessario",
          value: formatBrl(result.requiredMonthlyContribution),
        },
        {
          label: "Patrimonio projetado",
          value: formatBrl(result.projectedPatrimony),
        },
        {
          label: "Trajetoria atual",
          value: result.isOnTrack ? "Atinge o alvo" : "Aporte abaixo do necessario",
        },
        {
          label: "Aporte se aposentar 5 anos depois",
          value: formatBrl(result.sensitivityMinus20pct),
        },
        {
          label: "Aporte se aposentar 5 anos antes",
          value: formatBrl(result.sensitivityPlus20pct),
        },
        {
          label: "Ganho real anual",
          value: formatPercent(result.realReturnPct),
        },
        {
          label: "Meses ate a aposentadoria",
          value: `${result.monthsToRetirement} meses`,
        },
      ]}
      resultDescription="Usa Fisher (juros − inflacao) para o ganho real e a regra dos 25x (4% SWR) para o patrimonio alvo."
    />
  );
}
