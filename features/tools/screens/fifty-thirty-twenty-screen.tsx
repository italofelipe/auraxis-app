import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateOrcamento,
  createDefaultOrcamentoFormState,
  validateOrcamentoForm,
  type OrcamentoFormState,
  type OrcamentoResult,
} from "@/features/tools/services/calculators/orcamento-50-30-20";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import {
  formatBrl,
  formatPercent,
} from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<OrcamentoFormState, OrcamentoResult> = {
  toolId: "fifty-thirty-twenty",
  ruleVersion: "2026.04",
  createDefault: createDefaultOrcamentoFormState,
  validate: (form) =>
    validateOrcamentoForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) => calculateOrcamento(form) as unknown as OrcamentoResult,
  buildMetadataLabel: (form) =>
    `50/30/20 · ${form.mode === "detailed" ? "detalhado" : "simples"} · ${formatBrl(form.netIncome ?? 0)}`,
};

const FIELDS: readonly FieldDescriptor<OrcamentoFormState>[] = [
  {
    key: "netIncome",
    label: "Renda líquida mensal (R$)",
    type: "decimal",
    helperText: "Salário, pró-labore ou retiradas líquidas no mês.",
  },
  {
    key: "mode",
    label: "Modo",
    type: "text",
    helperText: "Use simple para a alocação ideal ou detailed para comparar com seus gastos reais.",
  },
  {
    key: "actualNeeds",
    label: "Gastos reais — Necessidades (R$)",
    type: "decimal",
    helperText: "Aluguel, supermercado, contas. Use 0 no modo simples.",
  },
  {
    key: "actualWants",
    label: "Gastos reais — Desejos (R$)",
    type: "decimal",
    helperText: "Lazer, restaurantes, assinaturas. Use 0 no modo simples.",
  },
  {
    key: "actualInvestments",
    label: "Gastos reais — Investimentos (R$)",
    type: "decimal",
    helperText: "Aportes em previdência, ações, FIIs. Use 0 no modo simples.",
  },
];

const CATEGORY_LABEL: Record<string, string> = {
  needs: "Necessidades",
  wants: "Desejos",
  investments: "Investimentos",
};

/**
 * 50/30/20 budgeting calculator screen.
 * @returns The screen tree.
 */
export function FiftyThirtyTwentyScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Orçamento 50/30/20"
      subtitle="Distribua sua renda entre necessidades, desejos e investimentos."
      testID="fifty-thirty-twenty-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(_, result) => {
        const idealMetrics = result.slices.map((slice) => ({
          label: `Ideal ${CATEGORY_LABEL[slice.category]} (${formatPercent(slice.idealPct)})`,
          value: formatBrl(slice.idealAmount),
        }));
        const actualMetrics =
          result.totalActual !== null
            ? [
                { label: "Total gasto", value: formatBrl(result.totalActual) },
                {
                  label: result.surplus !== null && result.surplus < 0 ? "Déficit" : "Sobra",
                  value: formatBrl(result.surplus ?? 0),
                },
              ]
            : [];
        const alertMetrics = result.slices
          .filter((slice) => slice.alert && slice.deviationPct !== null)
          .map((slice) => ({
            label: `Desvio ${CATEGORY_LABEL[slice.category]}`,
            value: `${slice.deviationPct! > 0 ? "+" : ""}${formatPercent(slice.deviationPct ?? 0)}`,
          }));
        return [...idealMetrics, ...actualMetrics, ...alertMetrics];
      }}
      resultDescription="Alertas aparecem quando o desvio passa de 10 pontos percentuais."
    />
  );
}
