import { useState, type ReactElement } from "react";
import { ActivityIndicator } from "react-native";

import { Paragraph, XStack, YStack } from "tamagui";

import type { UserInsight } from "@/features/insights/contracts";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export interface WeeklyInsightCardProps {
  readonly insight: UserInsight | null;
  readonly isLoading: boolean;
  readonly isNew: boolean;
  readonly onMarkAsRead: (insightId: string) => void | Promise<void>;
}

export function WeeklyInsightCard({
  insight,
  isLoading,
  isNew,
  onMarkAsRead,
}: WeeklyInsightCardProps): ReactElement {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = (): void => {
    if (!insight) {
      return;
    }
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (nextExpanded && isNew) {
      void onMarkAsRead(insight.id);
    }
  };

  return (
    <AppSurfaceCard
      title="Insight da semana"
      description="Uma leitura personalizada sobre seus movimentos recentes."
    >
      {isLoading ? (
        <YStack
          minHeight={104}
          alignItems="center"
          justifyContent="center"
          testID="weekly-insight-loading"
        >
          <ActivityIndicator />
        </YStack>
      ) : null}

      {!isLoading && !insight ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$4">
          Seu insight semanal esta sendo preparado
        </Paragraph>
      ) : null}

      {!isLoading && insight ? (
        <YStack gap="$3">
          <XStack alignItems="center" gap="$2" flexWrap="wrap">
            {isNew ? <AppBadge tone="primary">NOVO</AppBadge> : null}
            <Paragraph color="$secondary" fontFamily="$heading" fontSize="$6">
              {insight.keyMetric}
            </Paragraph>
          </XStack>

          {expanded ? (
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              {insight.content}
            </Paragraph>
          ) : null}

          <AppButton tone="secondary" onPress={handleToggle}>
            {expanded ? "Ver menos" : "Ver mais"}
          </AppButton>
        </YStack>
      ) : null}
    </AppSurfaceCard>
  );
}
