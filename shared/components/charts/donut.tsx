import type { ReactElement } from "react";

import { YStack, useTheme } from "tamagui";
import Svg, { Circle, G } from "react-native-svg";

import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppText } from "@/shared/components/app-text";
import {
  computeDonutSegments,
  computeRingGeometry,
} from "@/shared/utils/chart-geometry";

/** A single donut slice: an id, a human label, a colour and a weight. */
export interface DonutDatum {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly total: number;
}

export interface DonutProps {
  readonly data: readonly DonutDatum[];
  /** Outer diameter in px. */
  readonly size?: number;
  /** Ring thickness in px. */
  readonly thickness?: number;
  /** Small overline above the centred value (e.g. a month — "JUN"). */
  readonly centerTop?: string;
  /** Centred value (e.g. "R$ 11,9k"), rendered in the mono money font. */
  readonly centerValue?: string;
  readonly testID?: string;
}

/**
 * Concentric donut chart drawn with `react-native-svg`. Each datum becomes an
 * arc sized by its share of the total, laid head-to-tail over a neutral track
 * ring. Optional centred labels (overline + money value) sit in the hole.
 *
 * Segment colours come from `data[].color`; the track colour is resolved from
 * the theme (no hardcoded hex). Geometry/dash math lives in
 * `shared/utils/chart-geometry`.
 *
 * @param props Slices plus optional sizing and centre labels.
 * @returns The donut SVG with centred labels.
 */
export function Donut({
  data,
  size = 168,
  thickness = 26,
  centerTop,
  centerValue,
  testID,
}: DonutProps): ReactElement {
  const theme = useTheme();
  const trackColor = theme.borderColor?.val ?? "#000000";

  const { center, radius, circumference } = computeRingGeometry(size, thickness);
  const segments = computeDonutSegments(data, circumference);

  return (
    <YStack width={size} height={size} alignItems="center" justifyContent="center" testID={testID}>
      <Svg width={size} height={size}>
        {/* Rotate -90deg so arcs start at 12 o'clock. */}
        <G rotation={-90} originX={center} originY={center}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={thickness}
            fill="none"
          />
          {segments.map((segment) => (
            <Circle
              key={segment.id}
              cx={center}
              cy={center}
              r={radius}
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={[segment.dashArray[0], segment.dashArray[1]]}
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="butt"
              fill="none"
            />
          ))}
        </G>
      </Svg>
      <YStack
        position="absolute"
        alignItems="center"
        justifyContent="center"
        gap="$1"
      >
        {centerTop ? (
          <AppText size="caption" tone="muted">
            {centerTop}
          </AppText>
        ) : null}
        {centerValue ? (
          <AppMoneyText fontSize="$6">{centerValue}</AppMoneyText>
        ) : null}
      </YStack>
    </YStack>
  );
}
