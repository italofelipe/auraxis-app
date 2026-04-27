import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { AppStack } from "@/shared/components/app-stack";
import { SkeletonRow } from "@/shared/skeletons/skeleton-row";

export interface GoalListSkeletonProps {
  readonly rows?: number;
  readonly testID?: string;
}

/**
 * Placeholder layout for a list of goal cards. Each row imitates the
 * "title / progress bar / progress value" stack.
 */
export function GoalListSkeleton({
  rows = 3,
  testID,
}: GoalListSkeletonProps): ReactElement {
  return (
    <AppStack
      gap="$4"
      paddingVertical="$4"
      paddingHorizontal="$4"
      backgroundColor="$surfaceCard"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$2"
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando metas"
      testID={testID}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <YStack key={`goal-skeleton-${index}`} gap="$2">
          <SkeletonRow width="74%" height="$1" />
          <SkeletonRow width="100%" height="$1" />
          <SkeletonRow width="38%" height="$1" />
        </YStack>
      ))}
    </AppStack>
  );
}
