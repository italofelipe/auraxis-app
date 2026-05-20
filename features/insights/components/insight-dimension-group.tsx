import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { InsightCard } from "@/features/insights/components/insight-card";
import type { InsightDimensionGroup as InsightDimensionGroupModel } from "@/features/insights/hooks/use-insights-by-dimension";

export interface InsightDimensionGroupProps {
  readonly group: InsightDimensionGroupModel;
}

export function InsightDimensionGroup({
  group,
}: InsightDimensionGroupProps): ReactElement {
  return (
    <YStack gap="$3" testID={`insight-group-${group.dimension}`}>
      <YStack gap="$1">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
          {group.label}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {group.items.length} insight{group.items.length === 1 ? "" : "s"}
        </Paragraph>
      </YStack>
      <YStack gap="$2">
        {group.items.map((item) => (
          <InsightCard key={`${group.dimension}-${item.type}-${item.title}`} item={item} />
        ))}
      </YStack>
    </YStack>
  );
}
