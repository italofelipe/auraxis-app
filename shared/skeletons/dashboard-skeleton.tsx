import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { AppStack } from "@/shared/components/app-stack";
import { SkeletonRow } from "@/shared/skeletons/skeleton-row";

export interface DashboardSkeletonProps {
  readonly testID?: string;
}

/**
 * Placeholder layout for the dashboard hero + summary grid. Lays out
 * one big hero card and a 2x2 grid of metric tiles so the page does
 * not collapse during the first paint.
 */
export function DashboardSkeleton({
  testID,
}: DashboardSkeletonProps): ReactElement {
  return (
    <AppStack
      gap="$4"
      paddingVertical="$4"
      paddingHorizontal="$4"
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando painel"
      testID={testID}
    >
      <YStack
        backgroundColor="$surfaceCard"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$2"
        gap="$3"
        padding="$4"
      >
        <SkeletonRow width="42%" height="$1" />
        <SkeletonRow width="68%" height="$3" />
        <SkeletonRow width="36%" height="$1" />
      </YStack>

      <XStack gap="$3" flexWrap="wrap">
        {Array.from({ length: 4 }).map((_, index) => (
          <YStack
            key={`dashboard-tile-${index}`}
            backgroundColor="$surfaceCard"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius="$2"
            flexBasis="48%"
            flexGrow={1}
            gap="$2"
            padding="$3"
          >
            <SkeletonRow width="64%" height="$1" />
            <SkeletonRow width="46%" height="$2" />
          </YStack>
        ))}
      </XStack>
    </AppStack>
  );
}
