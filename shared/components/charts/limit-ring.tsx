import type { ReactElement } from "react";

import { YStack, useTheme } from "tamagui";
import Svg, { Circle, G } from "react-native-svg";

import { AppText } from "@/shared/components/app-text";
import {
  clampPercent,
  computeRingGeometry,
  dashOffsetForPercent,
} from "@/shared/utils/chart-geometry";

export interface LimitRingProps {
  /** Progress percentage (0–100); values outside are clamped. */
  readonly pct: number;
  /** Progress arc colour — caller passes the danger colour past the threshold. */
  readonly color: string;
  /** Track colour; defaults to the theme border colour. */
  readonly trackColor?: string;
  /** Outer diameter in px. */
  readonly size?: number;
  /** Arc thickness in px. */
  readonly strokeWidth?: number;
  /** Caption under the percentage (e.g. "usado"). */
  readonly centerLabel?: string;
  readonly testID?: string;
}

/**
 * Single-arc progress ring (gauge) drawn with `react-native-svg`. Shows a big
 * percentage and an optional caption in the centre. The caller owns the colour
 * decision (e.g. switch to the danger colour above 85%), so this stays a pure
 * presentational ring.
 *
 * @param props Percentage, arc colour and optional sizing/track/label.
 * @returns The progress ring SVG with centred labels.
 */
export function LimitRing({
  pct,
  color,
  trackColor,
  size = 132,
  strokeWidth = 13,
  centerLabel = "usado",
  testID,
}: LimitRingProps): ReactElement {
  const theme = useTheme();
  const resolvedTrack = trackColor ?? theme.borderColor?.val ?? "#000000";

  const { center, radius, circumference } = computeRingGeometry(size, strokeWidth);
  const safePct = clampPercent(pct);
  const dashOffset = dashOffsetForPercent(safePct, circumference);

  return (
    <YStack width={size} height={size} alignItems="center" justifyContent="center" testID={testID}>
      <Svg width={size} height={size}>
        {/* Rotate -90deg so the arc grows clockwise from 12 o'clock. */}
        <G rotation={-90} originX={center} originY={center}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={resolvedTrack}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <YStack position="absolute" alignItems="center" justifyContent="center">
        <AppText fontSize="$8" fontWeight="$7">
          {`${Math.round(safePct)}%`}
        </AppText>
        {centerLabel ? (
          <AppText size="caption" tone="muted">
            {centerLabel}
          </AppText>
        ) : null}
      </YStack>
    </YStack>
  );
}
