import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { AppStack } from "@/shared/components/app-stack";
import { SkeletonRow } from "@/shared/skeletons/skeleton-row";

export interface BudgetsListSkeletonProps {
  readonly rows?: number;
  readonly testID?: string;
}

/**
 * Placeholder layout for the budgets list — category title on top, a
 * progress bar imitation in the middle, and a "spent / limit" line at
 * the bottom.
 */
export function BudgetsListSkeleton({
  rows = 3,
  testID,
}: BudgetsListSkeletonProps): ReactElement {
  return (
    <AppStack
      gap="$4"
      paddingVertical="$3"
      paddingHorizontal="$4"
      backgroundColor="$surfaceCard"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$2"
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando orcamentos"
      testID={testID}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <YStack key={`budget-skeleton-${index}`} gap="$2">
          <SkeletonRow width="50%" height="$1" />
          <SkeletonRow width="100%" height="$1" />
          <SkeletonRow width="44%" height="$1" />
        </YStack>
      ))}
    </AppStack>
  );
}
