import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { AiInsightSurface } from "@/features/insights/components/ai-insight-surface";
import { InsightDimensionGroup } from "@/features/insights/components/insight-dimension-group";
import type {
  AiInsightsController,
} from "@/features/insights/hooks/use-ai-insights-controller";
import { groupInsightItemsByDimension } from "@/features/insights/hooks/use-insights-by-dimension";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSectionHeader } from "@/shared/components/app-section-header";

export interface InsightHubProps {
  readonly controller: AiInsightsController;
}

export function InsightHub({ controller }: InsightHubProps): ReactElement {
  return (
    <YStack gap="$4">
      <AiInsightSurface controller={controller} />
      <CurrentInsightSection controller={controller} />
      <HistorySection controller={controller} />
    </YStack>
  );
}

function CurrentInsightSection({
  controller,
}: InsightHubProps): ReactElement | null {
  if (!controller.currentInsight || controller.dimensionGroups.length === 0) {
    return null;
  }

  return (
    <YStack gap="$3">
      <AppSectionHeader
        title="Insight atual"
        description={controller.currentInsight.periodLabel}
      />
      {controller.dimensionGroups.map((group) => (
        <InsightDimensionGroup key={group.dimension} group={group} />
      ))}
    </YStack>
  );
}

function HistorySection({ controller }: InsightHubProps): ReactElement {
  return (
    <YStack gap="$3">
      <AppSectionHeader
        title="Historico"
        description="Registros salvos pela geracao de IA."
      />
      <AppQueryState
        query={controller.historyQuery}
        options={{
          loading: {
            title: "Carregando insights",
            description: "Buscando o historico salvo.",
          },
          empty: {
            title: "Nenhum insight gerado",
            description: "Gere a primeira leitura para criar seu historico.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar insights",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.history.length === 0,
        }}
        emptyComponent={
          <AppEmptyState
            illustration="insights"
            title="Sem insights salvos"
            description="Gere uma leitura para acompanhar seu historico por periodo."
          />
        }
      >
        {() => (
          <YStack gap="$3">
            {controller.history.map((insight) => (
              <HistoryInsightCard
                key={insight.id}
                insight={insight}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </YStack>
  );
}

function HistoryInsightCard({
  insight,
}: {
  readonly insight: AiInsightsController["history"][number];
}): ReactElement {
  const groups = groupInsightItemsByDimension(insight.items);

  return (
    <YStack
      gap="$3"
      paddingVertical="$3"
      borderBottomColor="$borderColor"
      borderBottomWidth={1}
    >
      <YStack gap="$3">
        <YStack gap="$1">
          <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
            {insight.keyMetric}
          </Paragraph>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {`${insight.periodLabel} · ${insight.periodType}`}
          </Paragraph>
        </YStack>
        {insight.summary?.headline ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {String(insight.summary.headline)}
          </Paragraph>
        ) : null}
        {groups.map((group) => (
          <InsightDimensionGroup key={`${insight.id}-${group.dimension}`} group={group} />
        ))}
      </YStack>
    </YStack>
  );
}
