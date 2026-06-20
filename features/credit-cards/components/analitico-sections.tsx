import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import type { TopRow } from "@/features/credit-cards/model/credit-card-analytics";
import type {
  CardTotal,
  CategoryGroup,
  MonthlyCardSeries,
} from "@/features/credit-cards/model/credit-card-aggregation";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppSectionHeader } from "@/shared/components/app-section-header";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import {
  AreaLineChart,
  type AreaLinePoint,
  Donut,
  type DonutDatum,
  HBars,
  type HBarsDatum,
} from "@/shared/components/charts";
import { resolveSeriesColor } from "@/shared/theme";
import { formatCurrency, formatCurrencyShort } from "@/shared/utils/formatters";

/** Quantidade máxima de fatias/itens nas listas analíticas. */
const MAX_LEGEND = 6;

const toDonutDatum = (category: CategoryGroup): DonutDatum => ({
  id: category.tagId ?? "uncategorized",
  label: category.name,
  color: category.color,
  total: category.total,
});

/** Seção "Gastos por categoria": donut + legenda das maiores categorias. */
export function CategoryBreakdown({
  categories,
  billTotal,
  monthShortLabel,
}: {
  readonly categories: readonly CategoryGroup[];
  readonly billTotal: number;
  readonly monthShortLabel: string;
}): ReactElement {
  const slices = categories.slice(0, MAX_LEGEND).map(toDonutDatum);

  return (
    <AppSurfaceCard>
      <YStack gap="$4">
        <AppSectionHeader title="Gastos por categoria" />
        {slices.length > 0 ? (
          <XStack alignItems="center" gap="$4">
            <Donut
              data={slices}
              size={134}
              thickness={22}
              centerTop={monthShortLabel}
              centerValue={formatCurrencyShort(billTotal)}
            />
            <YStack flex={1} gap="$2">
              {slices.map((slice) => (
                <XStack key={slice.id} alignItems="center" gap="$2">
                  <YStack
                    width={8}
                    height={8}
                    borderRadius="$5"
                    backgroundColor={slice.color}
                  />
                  <AppText size="bodySm" tone="muted" flex={1} numberOfLines={1}>
                    {slice.label}
                  </AppText>
                  <AppMoneyText fontSize="$2">
                    {formatCurrencyShort(slice.total)}
                  </AppMoneyText>
                </XStack>
              ))}
            </YStack>
          </XStack>
        ) : (
          <AppText size="bodySm" tone="muted">
            Sem gastos categorizados neste mês.
          </AppText>
        )}
      </YStack>
    </AppSurfaceCard>
  );
}

const sumSeriesByMonth = (series: MonthlyCardSeries): readonly AreaLinePoint[] =>
  series.months.map((month, index) => ({
    label: month.slice(5),
    value: series.series.reduce(
      (sum, entry) => sum + (entry.values[index] ?? 0),
      0,
    ),
  }));

/** Seção "Evolução da fatura": linha de tendência (some todos os cartões). */
export function BillTrend({
  series,
}: {
  readonly series: MonthlyCardSeries;
}): ReactElement | null {
  const points = sumSeriesByMonth(series);
  const hasData = points.some((point) => point.value > 0);
  if (!hasData) {
    return null;
  }

  return (
    <AppSurfaceCard>
      <YStack gap="$4">
        <AppSectionHeader title="Evolução da fatura" />
        <AreaLineChart
          points={points}
          color={resolveSeriesColor(0)}
          currentIndex={points.length - 1}
        />
      </YStack>
    </AppSurfaceCard>
  );
}

const toCardBar = (card: CardTotal, index: number): HBarsDatum => ({
  id: card.cardId,
  label: card.name,
  color: resolveSeriesColor(index),
  value: card.total,
});

/** Seção "Gastos por cartão": barras horizontais por cartão. */
export function CardBreakdown({
  cardTotals,
}: {
  readonly cardTotals: readonly CardTotal[];
}): ReactElement | null {
  if (cardTotals.length === 0) {
    return null;
  }

  return (
    <AppSurfaceCard>
      <YStack gap="$4">
        <AppSectionHeader title="Gastos por cartão" />
        <HBars data={cardTotals.map(toCardBar)} />
      </YStack>
    </AppSurfaceCard>
  );
}

/** Seção "Maiores lançamentos": linhas com cor de categoria + cartão. */
export function TopRowsList({
  rows,
}: {
  readonly rows: readonly TopRow[];
}): ReactElement | null {
  if (rows.length === 0) {
    return null;
  }

  return (
    <AppSurfaceCard>
      <YStack gap="$3">
        <AppSectionHeader title="Maiores lançamentos" />
        <YStack gap="$3">
          {rows.map((row) => (
            <XStack key={row.id} alignItems="center" gap="$3">
              <YStack
                width={10}
                height={10}
                borderRadius="$5"
                backgroundColor={row.categoryColor}
              />
              <YStack flex={1} gap="$1">
                <AppText size="bodySm" numberOfLines={1}>
                  {row.title}
                </AppText>
                <AppText size="caption" tone="muted" numberOfLines={1}>
                  {`${row.categoryName} · ${row.cardName}`}
                </AppText>
              </YStack>
              <AppMoneyText fontSize="$3">
                {formatCurrency(row.amount)}
              </AppMoneyText>
            </XStack>
          ))}
        </YStack>
      </YStack>
    </AppSurfaceCard>
  );
}
