import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { DashboardTrendPoint } from "@/features/dashboard/contracts";
import {
  trendsChartProjector,
  type TrendsChartBar,
} from "@/features/dashboard/services/trends-chart-projector";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

export interface DashboardTrendsChartCardProps {
  readonly series: readonly DashboardTrendPoint[];
}

/**
 * Lightweight horizontal-bar trends chart for the dashboard.
 *
 * Avoids pulling a charting library — for the MVP, two stacked bars per
 * month covering up to the period max give the user enough resolution
 * to compare income vs expense at a glance.
 */
export function DashboardTrendsChartCard({
  series,
}: DashboardTrendsChartCardProps): ReactElement {
  const projection = trendsChartProjector.project(series);

  if (projection.bars.length === 0) {
    return (
      <AppSurfaceCard
        title="Tendencias"
        description="Ainda nao ha dados suficientes para exibir."
      >
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Os ultimos meses vao aparecer aqui assim que houver movimentacoes.
        </Paragraph>
      </AppSurfaceCard>
    );
  }

  return (
    <AppSurfaceCard
      title="Tendencias"
      description="Receitas e despesas dos ultimos meses."
    >
      <YStack gap="$3">
        {projection.bars.map((bar) => (
          <TrendsBarRow key={bar.month} bar={bar} />
        ))}
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Saldo acumulado: {formatCurrency(projection.netBalance)}
        </Paragraph>
      </YStack>
    </AppSurfaceCard>
  );
}

function TrendsBarRow({ bar }: { readonly bar: TrendsChartBar }): ReactElement {
  return (
    <YStack gap="$1">
      <XStack justifyContent="space-between">
        <Paragraph color="$color" fontFamily="$body" fontSize="$3">
          {bar.label}
        </Paragraph>
        <Paragraph
          color={bar.balance >= 0 ? "$success" : "$danger"}
          fontFamily="$body"
          fontSize="$3"
        >
          {formatCurrency(bar.balance)}
        </Paragraph>
      </XStack>
      <YStack gap="$1">
        <BarLine widthPct={bar.incomeWidth} color="$success" label="Receitas" amount={bar.income} />
        <BarLine widthPct={bar.expensesWidth} color="$danger" label="Despesas" amount={bar.expenses} />
      </YStack>
    </YStack>
  );
}

interface BarLineProps {
  readonly widthPct: number;
  readonly color: "$success" | "$danger";
  readonly label: string;
  readonly amount: number;
}

function BarLine({ widthPct, color, label, amount }: BarLineProps): ReactElement {
  return (
    <XStack alignItems="center" gap="$2">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2" width={56}>
        {label}
      </Paragraph>
      <YStack flex={1} height={6} backgroundColor="$borderColor" borderRadius="$1">
        <YStack
          width={`${widthPct}%`}
          height="100%"
          backgroundColor={color}
          borderRadius="$1"
        />
      </YStack>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        {formatCurrency(amount)}
      </Paragraph>
    </XStack>
  );
}
