import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import type { AnalyticsViewModel } from "@/features/credit-cards/model/credit-card-analytics";
import {
  BillTrend,
  CardBreakdown,
  CategoryBreakdown,
  TopRowsList,
} from "@/features/credit-cards/components/analitico-sections";
import { AppMetricCard } from "@/shared/components/app-metric-card";
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
} from "@/shared/utils/formatters";

const KPI_MIN_WIDTH = 140;

/** Props da visão "Analítico". */
export interface AnaliticoViewProps {
  /** View-model da visão Analítico. */
  readonly analitico: AnalyticsViewModel;
  /** Rótulo curto do mês selecionado (centro do donut). */
  readonly monthShortLabel: string;
  readonly testID?: string;
}

/**
 * Visão "Analítico": grade de KPIs, gastos por categoria (donut + legenda),
 * evolução da fatura (área), gastos por cartão (barras) e os maiores
 * lançamentos. Apresentacional — recebe o view-model via props.
 *
 * @param props View-model de Analítico e rótulo do mês.
 * @returns Composição da visão Analítico.
 */
export function AnaliticoView({
  analitico,
  monthShortLabel,
  testID,
}: AnaliticoViewProps): ReactElement {
  return (
    <YStack gap="$4" testID={testID ?? "analitico-view"}>
      <KpiGrid analitico={analitico} />
      <CategoryBreakdown
        categories={analitico.categories}
        billTotal={analitico.kpis.billTotal}
        monthShortLabel={monthShortLabel}
      />
      <BillTrend series={analitico.monthlySeries} />
      <CardBreakdown cardTotals={analitico.cardTotals} />
      <TopRowsList rows={analitico.topRows} />
    </YStack>
  );
}

function KpiGrid({
  analitico,
}: {
  readonly analitico: AnalyticsViewModel;
}): ReactElement {
  const { billTotal, variation, topCategory, limitUsedPct } = analitico.kpis;
  const hasIncrease = variation.delta > 0;
  const variationValue =
    variation.pct === null
      ? "—"
      : `${variation.pct >= 0 ? "+" : ""}${formatPercent(variation.pct)}`;

  return (
    <XStack flexWrap="wrap" gap="$3">
      <YStack flex={1} minWidth={KPI_MIN_WIDTH}>
        <AppMetricCard
          label="Fatura do mês"
          value={formatCurrencyShort(billTotal)}
        />
      </YStack>
      <YStack flex={1} minWidth={KPI_MIN_WIDTH}>
        <AppMetricCard
          label="Variação vs anterior"
          value={variationValue}
          tone={hasIncrease ? "danger" : "default"}
          helper={formatCurrencyShort(Math.abs(variation.delta))}
        />
      </YStack>
      <YStack flex={1} minWidth={KPI_MIN_WIDTH}>
        <AppMetricCard
          label="Maior categoria"
          value={topCategory ? topCategory.name : "—"}
          helper={topCategory ? formatCurrency(topCategory.total) : undefined}
        />
      </YStack>
      <YStack flex={1} minWidth={KPI_MIN_WIDTH}>
        <AppMetricCard
          label="Limite usado"
          value={limitUsedPct === null ? "—" : formatPercent(limitUsedPct)}
        />
      </YStack>
    </XStack>
  );
}
