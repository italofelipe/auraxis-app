import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { AppStack } from "@/shared/components/app-stack";
import { SkeletonRow } from "@/shared/skeletons/skeleton-row";

export interface TransactionListSkeletonProps {
  readonly rows?: number;
  readonly testID?: string;
}

/**
 * Placeholder layout that mimics the transaction list rows
 * (left column: title + tag, right column: value + status).
 */
export function TransactionListSkeleton({
  rows = 4,
  testID,
}: TransactionListSkeletonProps): ReactElement {
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
      accessibilityLabel="Carregando transacoes"
      testID={testID}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <XStack
          key={`tx-skeleton-${index}`}
          alignItems="center"
          justifyContent="space-between"
          gap="$3"
        >
          <YStack flex={1} gap="$2">
            <SkeletonRow width="68%" height="$1" />
            <SkeletonRow width="42%" height="$1" />
          </YStack>
          <YStack alignItems="flex-end" gap="$2">
            <SkeletonRow width={80} height="$1" />
            <SkeletonRow width={56} height="$1" />
          </YStack>
        </XStack>
      ))}
    </AppStack>
  );
}
