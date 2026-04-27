import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { AppStack } from "@/shared/components/app-stack";
import { SkeletonRow } from "@/shared/skeletons/skeleton-row";

export interface WalletEntryListSkeletonProps {
  readonly rows?: number;
  readonly testID?: string;
}

/**
 * Placeholder layout mimicking the wallet entry list (asset + ticker on
 * the left, current value + variation on the right).
 */
export function WalletEntryListSkeleton({
  rows = 4,
  testID,
}: WalletEntryListSkeletonProps): ReactElement {
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
      accessibilityLabel="Carregando carteira"
      testID={testID}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <XStack
          key={`wallet-skeleton-${index}`}
          alignItems="center"
          justifyContent="space-between"
          gap="$3"
        >
          <YStack flex={1} gap="$2">
            <SkeletonRow width="58%" height="$1" />
            <SkeletonRow width="34%" height="$1" />
          </YStack>
          <YStack alignItems="flex-end" gap="$2">
            <SkeletonRow width={92} height="$1" />
            <SkeletonRow width={48} height="$1" />
          </YStack>
        </XStack>
      ))}
    </AppStack>
  );
}
