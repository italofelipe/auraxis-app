import type { ReactElement } from "react";

import { XStack, YStack, useTheme } from "tamagui";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { AppText } from "@/shared/components/app-text";
import {
  buildAreaLinePath,
  buildLinePath,
  projectPoints,
} from "@/shared/utils/chart-geometry";

/** A single plotted point: an axis label and its numeric value. */
export interface AreaLinePoint {
  readonly label: string;
  readonly value: number;
}

export interface AreaLineChartProps {
  readonly points: readonly AreaLinePoint[];
  /** Line + fill colour (the fill is a vertical fade of this colour). */
  readonly color: string;
  /** Plot height in px (x-axis labels render below). */
  readonly height?: number;
  /** Index of the highlighted point (drawn larger/filled). */
  readonly currentIndex?: number;
  /** Tap handler; receives the index of the selected point. */
  readonly onSelectPoint?: (index: number) => void;
  readonly testID?: string;
}

// Fixed viewBox width: the SVG scales to its container, so the absolute number
// only sets the internal coordinate space, not the on-screen size.
const VIEWBOX_WIDTH = 320;
const POINT_RADIUS = 4;
const ACTIVE_POINT_RADIUS = 6;
const VERTICAL_PADDING = 8;

/**
 * Area + line chart drawn with `react-native-svg`. Renders a gradient-filled
 * area under a stroked line with a circle at each point; the highlighted point
 * (`currentIndex`) is enlarged, and tapping a point invokes `onSelectPoint`.
 * X-axis labels render in a row beneath the plot.
 *
 * Scale/path math lives in `shared/utils/chart-geometry`; the line/fill colour
 * comes from the `color` prop and the gradient id is derived so multiple charts
 * can coexist.
 *
 * @param props Points, colour and optional height/selection wiring.
 * @returns The area-line chart with x-axis labels.
 */
export function AreaLineChart({
  points,
  color,
  height = 140,
  currentIndex,
  onSelectPoint,
  testID,
}: AreaLineChartProps): ReactElement {
  const theme = useTheme();
  const axisColor = theme.muted?.val ?? "#000000";

  const values = points.map((point) => point.value);
  const projected = projectPoints({
    values,
    width: VIEWBOX_WIDTH,
    height,
    paddingY: VERTICAL_PADDING,
  });
  const linePath = buildLinePath(projected);
  const areaPath = buildAreaLinePath(projected, height);
  // Stable, color-derived gradient id so several charts don't collide.
  const gradientId = `area-fill-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <YStack gap="$2" testID={testID}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.28} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        {areaPath ? <Path d={areaPath} fill={`url(#${gradientId})`} /> : null}
        {linePath ? (
          <Path d={linePath} stroke={color} strokeWidth={2} fill="none" />
        ) : null}
        {projected.map((point, index) => {
          const isActive = index === currentIndex;
          return (
            <Circle
              key={points[index].label}
              cx={point.x}
              cy={point.y}
              r={isActive ? ACTIVE_POINT_RADIUS : POINT_RADIUS}
              fill={isActive ? color : axisColor}
              onPress={
                onSelectPoint ? () => onSelectPoint(index) : undefined
              }
            />
          );
        })}
      </Svg>
      <XStack justifyContent="space-between">
        {points.map((point) => (
          <AppText key={point.label} size="caption" tone="muted">
            {point.label}
          </AppText>
        ))}
      </XStack>
    </YStack>
  );
}
