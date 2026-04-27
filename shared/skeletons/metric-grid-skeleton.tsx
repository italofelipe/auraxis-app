import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { AppStack } from "@/shared/components/app-stack";
import { SkeletonRow } from "@/shared/skeletons/skeleton-row";

export interface MetricGridSkeletonProps {
  /** Number of metric tiles to render. Defaults to 4. */
  readonly tiles?: number;
  readonly testID?: string;
}

/**
 * Generic placeholder for any "row of metric cards" layout — useful as a
 * loading state for summary grids that don't have a dedicated skeleton.
 */
export function MetricGridSkeleton({
  tiles = 4,
  testID,
}: MetricGridSkeletonProps): ReactElement {
  return (
    <AppStack
      paddingVertical="$3"
      paddingHorizontal="$4"
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando indicadores"
      testID={testID}
    >
      <XStack gap="$3" flexWrap="wrap">
        {Array.from({ length: tiles }).map((_, index) => (
          <YStack
            key={`metric-tile-${index}`}
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
