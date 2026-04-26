import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { FocusMetric, FocusMetricId } from "@/features/focus/contracts";
import {
  useFocusScreenController,
  type FocusScreenController,
} from "@/features/focus/hooks/use-focus-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const METRIC_LABEL: Readonly<Record<FocusMetricId, string>> = {
  monthlyBurnRate: "Gasto mensal",
  freeBalanceAfterFixed: "Saldo livre",
  savingsVsPreviousMonth: "Variacao vs mes anterior",
  monthlyExpenses: "Despesas",
  monthlyIncome: "Receitas",
};

const formatMetricValue = (metric: FocusMetric): string => {
  if (metric.unit === "percent") {
    return `${metric.value.toFixed(1)}%`;
  }
  return formatCurrency(metric.value);
};

const formatTrend = (metric: FocusMetric): string | null => {
  if (!metric.trend || metric.trend.percent === null) {
    return null;
  }
  const sign = metric.trend.delta > 0 ? "+" : "";
  return `${sign}${metric.trend.percent.toFixed(1)}% vs mes anterior`;
};

export function FocusScreen(): ReactElement {
  const controller = useFocusScreenController();
  return (
    <AppScreen>
      <SelectorCard controller={controller} />
      <MetricCard metric={controller.metric} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: FocusScreenController;
}

function SelectorCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="O numero que importa"
      description="Escolha uma metrica como foco do mes."
    >
      <XStack gap="$2" flexWrap="wrap">
        {controller.metricIds.map((metricId) => (
          <AppButton
            key={metricId}
            tone={
              controller.selectedMetricId === metricId ? "primary" : "secondary"
            }
            onPress={() => controller.handleSelectMetric(metricId)}
          >
            {METRIC_LABEL[metricId]}
          </AppButton>
        ))}
      </XStack>
    </AppSurfaceCard>
  );
}

function MetricCard({ metric }: { readonly metric: FocusMetric }): ReactElement {
  return (
    <AppSurfaceCard title={metric.label} description={metric.caption}>
      {metric.unavailable ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Sem dados suficientes para esta metrica neste momento.
        </Paragraph>
      ) : (
        <YStack gap="$3">
          <Paragraph color="$color" fontFamily="$heading" fontSize="$10">
            {formatMetricValue(metric)}
          </Paragraph>
          <MetricTrendRow metric={metric} />
        </YStack>
      )}
    </AppSurfaceCard>
  );
}

function MetricTrendRow({
  metric,
}: {
  readonly metric: FocusMetric;
}): ReactElement {
  const trendLabel = formatTrend(metric);
  if (trendLabel === null) {
    return (
      <AppKeyValueRow
        label="Variacao"
        value={
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Sem comparativo disponivel.
          </Paragraph>
        }
      />
    );
  }
  const tone: "primary" | "danger" | "default" =
    metric.trend?.direction === "up"
      ? "primary"
      : metric.trend?.direction === "down"
        ? "danger"
        : "default";
  return (
    <AppKeyValueRow
      label="Tendencia"
      value={<AppBadge tone={tone}>{trendLabel}</AppBadge>}
    />
  );
}
