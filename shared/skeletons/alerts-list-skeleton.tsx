import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { AppStack } from "@/shared/components/app-stack";
import { SkeletonRow } from "@/shared/skeletons/skeleton-row";

export interface AlertsListSkeletonProps {
  readonly rows?: number;
  readonly testID?: string;
}

/**
 * Placeholder layout for the alerts list — title + description block on
 * the left, toggle stub on the right.
 */
export function AlertsListSkeleton({
  rows = 4,
  testID,
}: AlertsListSkeletonProps): ReactElement {
  return (
    <AppStack
      gap="$3"
      paddingVertical="$3"
      paddingHorizontal="$4"
      backgroundColor="$surfaceCard"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$2"
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando alertas"
      testID={testID}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <XStack
          key={`alert-skeleton-${index}`}
          alignItems="center"
          justifyContent="space-between"
          gap="$3"
        >
          <YStack flex={1} gap="$2">
            <SkeletonRow width="64%" height="$1" />
            <SkeletonRow width="84%" height="$1" />
          </YStack>
          <SkeletonRow width={48} height={24} radius="$2" />
        </XStack>
      ))}
    </AppStack>
  );
}
