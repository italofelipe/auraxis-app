import type { ReactElement } from "react";

import { type ColorTokens, XStack, YStack } from "tamagui";

export interface SkeletonRowProps {
  readonly height?: ColorTokens | number | string;
  readonly width?: ColorTokens | number | string;
  readonly radius?: ColorTokens | number | string;
}

/**
 * Themed placeholder bar used by composite skeleton layouts. Centralises
 * the muted-surface look so individual skeletons stay declarative.
 */
export function SkeletonRow({
  height = "$2",
  width = "100%",
  radius = "$1",
}: SkeletonRowProps): ReactElement {
  return (
    <YStack
      backgroundColor="$surfaceRaised"
      borderRadius={radius as never}
      height={height as never}
      width={width as never}
      opacity={0.7}
    />
  );
}

/**
 * Convenience layout for a "row with two columns" placeholder pattern
 * (e.g. label + value).
 */
export function SkeletonKeyValueRow(): ReactElement {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$3">
      <SkeletonRow width="46%" height="$1" />
      <SkeletonRow width="32%" height="$1" />
    </XStack>
  );
}
