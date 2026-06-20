import type { ReactElement } from "react";

import { YStack, useTheme } from "tamagui";

import { clampPercent } from "@/shared/utils/chart-geometry";

export interface MeterProps {
  /** Fill percentage (0–100); values outside are clamped. */
  readonly pct: number;
  /** Fill colour; defaults to the theme primary. Pass danger past threshold. */
  readonly color?: string;
  /** Bar thickness (size token). */
  readonly height?: number;
  readonly testID?: string;
}

const DEFAULT_HEIGHT = 8;

/**
 * Thin horizontal progress bar built from pure Tamagui Views. The fill width is
 * a percentage of the track, and the caller owns the colour (e.g. pass the
 * danger colour when over budget). The track colour comes from the theme.
 *
 * @param props Percentage plus optional colour and height.
 * @returns The meter bar.
 */
export function Meter({
  pct,
  color,
  height = DEFAULT_HEIGHT,
  testID,
}: MeterProps): ReactElement {
  const theme = useTheme();
  const fillColor = color ?? theme.primary?.val ?? "#000000";
  const safePct = clampPercent(pct);
  const widthPercent = `${safePct}%` as const;

  return (
    <YStack
      height={height}
      borderRadius="$5"
      backgroundColor="$surfaceRaised"
      overflow="hidden"
      testID={testID}
    >
      <YStack
        height="100%"
        width={widthPercent}
        borderRadius="$5"
        backgroundColor={fillColor}
      />
    </YStack>
  );
}
