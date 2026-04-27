import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { AppStack } from "@/shared/components/app-stack";
import { SkeletonRow } from "@/shared/skeletons/skeleton-row";

export interface FiscalDocumentsSkeletonProps {
  readonly rows?: number;
  readonly testID?: string;
}

/**
 * Placeholder layout for the fiscal documents list (description + date
 * on the left, amount + status badge on the right).
 */
export function FiscalDocumentsSkeleton({
  rows = 4,
  testID,
}: FiscalDocumentsSkeletonProps): ReactElement {
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
      accessibilityLabel="Carregando documentos fiscais"
      testID={testID}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <XStack
          key={`fiscal-skeleton-${index}`}
          alignItems="center"
          justifyContent="space-between"
          gap="$3"
        >
          <YStack flex={1} gap="$2">
            <SkeletonRow width="72%" height="$1" />
            <SkeletonRow width="38%" height="$1" />
          </YStack>
          <YStack alignItems="flex-end" gap="$2">
            <SkeletonRow width={84} height="$1" />
            <SkeletonRow width={64} height="$1" />
          </YStack>
        </XStack>
      ))}
    </AppStack>
  );
}
