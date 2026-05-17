import { useState, type ReactElement } from "react";
import { ActivityIndicator } from "react-native";

import { Paragraph, XStack, YStack } from "tamagui";

import { AiInsightTransparencyNotice } from "@/features/insights/components/ai-insight-transparency-notice";
import type { InsightItem, UserInsight } from "@/features/insights/contracts";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const PERIOD_TYPE_LABELS: Record<UserInsight["periodType"], string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensal",
  recap: "Recap",
};

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

interface WeeklyInsightExpandedContentProps {
  readonly insight: UserInsight;
}

interface WeeklyInsightItemListProps {
  readonly items: readonly InsightItem[];
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
        <AppBadge>{PERIOD_TYPE_LABELS[insight.periodType]}</AppBadge>
        <Paragraph color="$secondary" fontFamily="$heading" fontSize="$6">
          {insight.keyMetric}
        </Paragraph>
      </XStack>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        {insight.periodLabel}
      </Paragraph>

      {expanded ? <WeeklyInsightExpandedContent insight={insight} /> : null}

      <AppButton tone="secondary" onPress={onToggle}>
        {expanded ? "Ver menos" : "Ver mais"}
      </AppButton>
    </YStack>
  );
}

function WeeklyInsightExpandedContent({
  insight,
}: WeeklyInsightExpandedContentProps): ReactElement {
  const summaryHeadline =
    typeof insight.summary?.headline === "string" ? insight.summary.headline : null;
  const shouldRenderContent = !insight.items.some((item) => item.message === insight.content);

  return (
    <YStack gap="$3">
      {summaryHeadline ? (
        <Paragraph color="$color" fontFamily="$heading" fontSize="$4">
          {summaryHeadline}
        </Paragraph>
      ) : null}
      {shouldRenderContent ? (
        <Paragraph color="$color" fontFamily="$body" fontSize="$4">
          {insight.content}
        </Paragraph>
      ) : null}
      <WeeklyInsightItemList items={insight.items} />
    </YStack>
  );
}

function WeeklyInsightItemList({ items }: WeeklyInsightItemListProps): ReactElement {
  return (
    <YStack gap="$3" testID="weekly-insight-items">
      {items.map((item) => (
        <YStack key={`${item.type}-${item.title}`} gap="$1">
          <XStack alignItems="center" gap="$2" flexWrap="wrap">
            <AppBadge>{item.type}</AppBadge>
            <Paragraph color="$color" fontFamily="$heading" fontSize="$4">
              {item.title}
            </Paragraph>
          </XStack>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {item.message}
          </Paragraph>
          {item.evidence && item.evidence.length > 0 ? (
            <XStack gap="$2" flexWrap="wrap">
              {item.evidence.map((evidence) => (
                <AppBadge key={evidence}>{evidence}</AppBadge>
              ))}
            </XStack>
          ) : null}
        </YStack>
      ))}
    </YStack>
  );
}
