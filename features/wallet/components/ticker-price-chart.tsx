import { type ReactElement, useMemo } from "react";

import { Paragraph, View, XStack, YStack } from "tamagui";

import type { BrapiPricePoint } from "@/features/wallet/brapi-contracts";
import { formatCurrency } from "@/shared/utils/formatters";

const CHART_HEIGHT = 160;
const CHART_PADDING_VERTICAL = 8;
const MAX_PLOTTED_POINTS = 80;

export interface TickerPriceChartProps {
  readonly points: readonly BrapiPricePoint[];
  readonly testID?: string;
}

interface BarMetrics {
  readonly key: string;
  readonly heightPercent: number;
  readonly tone: "up" | "down" | "flat";
}

const samplePoints = (
  points: readonly BrapiPricePoint[],
): readonly BrapiPricePoint[] => {
  if (points.length <= MAX_PLOTTED_POINTS) {
    return points;
  }
  const step = points.length / MAX_PLOTTED_POINTS;
  const sampled: BrapiPricePoint[] = [];
  for (let index = 0; index < MAX_PLOTTED_POINTS; index += 1) {
    const sourceIndex = Math.min(
      points.length - 1,
      Math.floor(index * step),
    );
    sampled.push(points[sourceIndex]);
  }
  return sampled;
};

const computeBars = (
  points: readonly BrapiPricePoint[],
): readonly BarMetrics[] => {
  if (points.length === 0) {
    return [];
  }
  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min;
  return points.map((point, index) => {
    const ratio = span === 0 ? 0.5 : (point.close - min) / span;
    const previousClose = index === 0 ? point.close : points[index - 1].close;
    const tone: BarMetrics["tone"] =
      point.close > previousClose
        ? "up"
        : point.close < previousClose
          ? "down"
          : "flat";
    return {
      key: `${point.timestamp}-${index}`,
      heightPercent: 12 + ratio * 88,
      tone,
    };
  });
};

const toneToColor = (tone: BarMetrics["tone"]): string => {
  switch (tone) {
    case "up":
      return "$success";
    case "down":
      return "$danger";
    default:
      return "$muted";
  }
};

interface PriceMarkers {
  readonly min: number;
  readonly max: number;
  readonly first: number;
  readonly last: number;
  readonly variation: number;
}

const buildMarkers = (
  points: readonly BrapiPricePoint[],
): PriceMarkers | null => {
  if (points.length === 0) {
    return null;
  }
  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const first = points[0].close;
  const last = points[points.length - 1].close;
  const variation = first === 0 ? 0 : ((last - first) / first) * 100;
  return { min, max, first, last, variation };
};

/**
 * Pure React Native price chart.
 *
 * Renders a step-bar visualization of the close prices against the
 * range, plus min/max markers and a variation badge. Avoids any new
 * native dependency (no Skia/Victory/SVG) so the feature ships in the
 * existing Expo dev client without rebuilding.
 */
export function TickerPriceChart({
  points,
  testID,
}: TickerPriceChartProps): ReactElement {
  const sampled = useMemo(() => samplePoints(points), [points]);
  const bars = useMemo(() => computeBars(sampled), [sampled]);
  const markers = useMemo(() => buildMarkers(points), [points]);

  if (markers === null) {
    return (
      <YStack
        testID={testID ?? "ticker-price-chart-empty"}
        alignItems="center"
        justifyContent="center"
        height={CHART_HEIGHT}
      >
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Sem dados de cotacao para o periodo selecionado.
        </Paragraph>
      </YStack>
    );
  }

  return (
    <YStack gap="$2" testID={testID ?? "ticker-price-chart"}>
      <XStack justifyContent="space-between" alignItems="center">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Maxima: {formatCurrency(markers.max)}
        </Paragraph>
        <Paragraph
          color={
            markers.variation > 0
              ? "$success"
              : markers.variation < 0
                ? "$danger"
                : "$muted"
          }
          fontFamily="$body"
          fontSize="$3"
        >
          {markers.variation > 0 ? "+" : ""}
          {markers.variation.toFixed(2)}%
        </Paragraph>
      </XStack>
      <View
        height={CHART_HEIGHT}
        backgroundColor="$surfaceRaised"
        borderRadius="$2"
        paddingVertical={CHART_PADDING_VERTICAL}
        paddingHorizontal="$2"
        flexDirection="row"
        alignItems="flex-end"
        gap={2}
        testID="ticker-price-chart-canvas"
      >
        {bars.map((bar) => (
          <View
            key={bar.key}
            flex={1}
            height={`${bar.heightPercent}%`}
            backgroundColor={toneToColor(bar.tone)}
            borderRadius={2}
            opacity={0.85}
          />
        ))}
      </View>
      <XStack justifyContent="space-between" alignItems="center">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Minima: {formatCurrency(markers.min)}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {points.length} pontos
        </Paragraph>
      </XStack>
    </YStack>
  );
}
