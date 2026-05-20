import type { ComponentProps, ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack } from "tamagui";

import type { InsightItem } from "@/features/insights/contracts";
import { AppBadge } from "@/shared/components/app-badge";

export interface InsightCardProps {
  readonly item: InsightItem;
}

type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const ICON_BY_TYPE: Record<string, MaterialCommunityIconName> = {
  gasto_elevado: "trending-up",
  oportunidade_economia: "piggy-bank-outline",
  saude_financeira: "heart-pulse",
  alerta_orcamento: "alert-outline",
  padrao_gasto: "chart-bar",
  alerta_meta: "flag-outline",
  progresso_meta: "flag-checkered",
  planejamento_meta: "map-clock-outline",
  orcamento_ultrapassado: "alert-circle-outline",
  saude_orcamento_mensal: "finance",
  conquista_meta: "trophy-outline",
  savings_rate_gap: "cash-clock",
};

const resolveIcon = (type: string): MaterialCommunityIconName => {
  return ICON_BY_TYPE[type] ?? "lightbulb-on-outline";
};

export function InsightCard({ item }: InsightCardProps): ReactElement {
  return (
    <YStack
      gap="$2"
      padding="$3"
      backgroundColor="$surfaceCard"
      borderColor="$borderColor"
      borderRadius="$2"
      borderWidth={1}
      testID={`insight-card-${item.dimension ?? "general"}`}
    >
      <XStack alignItems="center" gap="$2">
        <MaterialCommunityIcons name={resolveIcon(item.type)} size={18} />
        <AppBadge>{item.type}</AppBadge>
      </XStack>
      <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
        {item.title}
      </Paragraph>
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
  );
}
