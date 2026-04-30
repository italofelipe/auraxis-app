import type { ReactElement } from "react";

import { CalculatorScreen } from "@/features/tools/components/calculator-screen";
import type { FieldDescriptor } from "@/features/tools/components/calculator-form";
import type { CalculatorSpec } from "@/features/tools/hooks/use-calculator-controller";
import {
  calculateAluguelVsCompra,
  createDefaultAluguelVsCompraFormState,
  validateAluguelVsCompraForm,
  type AluguelVsCompraFormState,
  type AluguelVsCompraResult,
} from "@/features/tools/services/calculators/aluguel-vs-compra";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const SPEC: CalculatorSpec<AluguelVsCompraFormState, AluguelVsCompraResult> = {
  toolId: "rent-vs-buy",
  ruleVersion: "2026.04",
  createDefault: createDefaultAluguelVsCompraFormState,
  validate: (form) =>
    validateAluguelVsCompraForm(form).map((error) => ({
      field: error.field,
      message: resolveCalculatorError(error.messageKey),
    })),
  calculate: (form) =>
    calculateAluguelVsCompra(form) as unknown as AluguelVsCompraResult,
  buildMetadataLabel: (form) =>
    `Imóvel ${formatBrl(form.propertyValue ?? 0)} · ${form.analysisYears}a`,
};

const FIELDS: readonly FieldDescriptor<AluguelVsCompraFormState>[] = [
  { key: "propertyValue", label: "Valor do imóvel (R$)", type: "decimal" },
  { key: "monthlyRent", label: "Aluguel mensal equivalente (R$)", type: "decimal" },
  { key: "downPaymentAvailable", label: "Entrada disponível (R$)", type: "decimal" },
  {
    key: "analysisYears",
    label: "Horizonte de análise (anos)",
    type: "integer",
    helperText: "Padrão 20 anos. Quanto maior, melhor para comparar.",
  },
  {
    key: "annualInvestmentReturnPct",
    label: "Rentabilidade anual ao alugar (%)",
    type: "decimal",
    helperText: "Selic ou CDB sugerido. Padrão 10%.",
  },
  {
    key: "annualPropertyValorizationPct",
    label: "Valorização anual do imóvel (%)",
    type: "decimal",
    helperText: "Padrão 5% — verifique para sua região.",
  },
  {
    key: "transactionCostsPct",
    label: "Custos da compra (%)",
    type: "decimal",
    helperText: "ITBI + escritura + reformas. Padrão 9% do valor.",
  },
  { key: "monthlyIptuCondominio", label: "IPTU + condomínio mensal (R$)", type: "decimal" },
  {
    key: "annualIpcaPct",
    label: "Inflação anual estimada (%)",
    type: "decimal",
    helperText: "Reajuste do aluguel. Padrão 4,5%.",
  },
  {
    key: "mortgageAnnualRatePct",
    label: "Taxa anual do financiamento (%)",
    type: "decimal",
    helperText: "Padrão 12% a.a. Taxa atual da Caixa.",
  },
];

export function RentVsBuyScreen(): ReactElement {
  return (
    <CalculatorScreen
      title="Alugar vs comprar"
      subtitle="Compare cenários no horizonte escolhido — patrimônio final dos dois lados."
      testID="rent-vs-buy-screen"
      spec={SPEC}
      fields={FIELDS}
      buildMetrics={(form, result) => [
        {
          label: result.buyIsBetter ? "Resultado" : "Resultado",
          value: result.buyIsBetter
            ? "Comprar vence em patrimônio final"
            : "Alugar vence em patrimônio final",
        },
        {
          label: "Break-even",
          value:
            result.breakEvenYear === null
              ? "Não atinge no horizonte"
              : `${result.breakEvenYear} anos`,
        },
        { label: "Patrimônio final — comprar", value: formatBrl(result.finalBuyNetWorth) },
        { label: "Patrimônio final — alugar", value: formatBrl(result.finalRentNetWorth) },
        { label: "Custo total — alugar", value: formatBrl(result.totalRentCost) },
        { label: "Custo total — comprar", value: formatBrl(result.totalBuyCost) },
        {
          label: `Imóvel após ${form.analysisYears}a`,
          value: formatBrl(result.propertyValueAtEnd),
        },
        { label: "Entrada se investida", value: formatBrl(result.downPaymentInvested) },
      ]}
      resultDescription="A diferença entre os patrimônios depende muito de juros, valorização e horizonte."
    />
  );
}
