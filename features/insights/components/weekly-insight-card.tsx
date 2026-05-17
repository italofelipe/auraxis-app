import { useState, type ReactElement } from "react";
import { ActivityIndicator } from "react-native";

import { Paragraph, XStack, YStack } from "tamagui";

import { AiInsightTransparencyNotice } from "@/features/insights/components/ai-insight-transparency-notice";
import type { UserInsight } from "@/features/insights/contracts";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export interface WeeklyInsightAiConsent {
  readonly enabled: boolean;
  readonly isHydrated: boolean;
  readonly hasConsent: boolean;
  readonly onGrantConsent: () => void | Promise<void>;
}

export interface WeeklyInsightCardProps {
  readonly insight: UserInsight | null;
  readonly isLoading: boolean;
  readonly isNew: boolean;
  readonly onMarkAsRead: (insightId: string) => void | Promise<void>;
  readonly aiConsent?: WeeklyInsightAiConsent;
}

interface WeeklyInsightBodyProps {
  readonly insight: UserInsight | null;
  readonly isLoading: boolean;
  readonly isNew: boolean;
  readonly expanded: boolean;
  readonly canRenderInsight: boolean;
  readonly onToggle: () => void;
}

export function WeeklyInsightCard({
  insight,
  isLoading,
  isNew,
  onMarkAsRead,
  aiConsent,
}: WeeklyInsightCardProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const aiConsentEnabled = aiConsent?.enabled === true;
  const canRenderInsight = !aiConsentEnabled || (aiConsent.isHydrated && aiConsent.hasConsent);

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
      {aiConsentEnabled ? (
        <AiInsightTransparencyNotice
          hasConsent={aiConsent.hasConsent}
          isHydrated={aiConsent.isHydrated}
          onGrantConsent={aiConsent.onGrantConsent}
        />
      ) : null}

      <WeeklyInsightBody
        insight={insight}
        isLoading={isLoading}
        isNew={isNew}
        expanded={expanded}
        canRenderInsight={canRenderInsight}
        onToggle={handleToggle}
      />
    </AppSurfaceCard>
  );
}

function WeeklyInsightBody({
  insight,
  isLoading,
  isNew,
  expanded,
  canRenderInsight,
  onToggle,
}: WeeklyInsightBodyProps): ReactElement | null {
  if (!canRenderInsight) {
    return null;
  }

  if (isLoading) {
    return (
      <YStack
        minHeight={104}
        alignItems="center"
        justifyContent="center"
        testID="weekly-insight-loading"
      >
        <ActivityIndicator />
      </YStack>
    );
  }

  if (!insight) {
    return (
      <Paragraph color="$muted" fontFamily="$body" fontSize="$4">
        Seu insight semanal esta sendo preparado
      </Paragraph>
    );
  }

  return (
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

      <AppButton tone="secondary" onPress={onToggle}>
        {expanded ? "Ver menos" : "Ver mais"}
      </AppButton>
    </YStack>
  );
}
