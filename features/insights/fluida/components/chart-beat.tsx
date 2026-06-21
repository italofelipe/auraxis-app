import type { ReactElement } from "react";

import Animated from "react-native-reanimated";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";
import Svg, { Rect } from "react-native-svg";

import { borderWidths } from "@/config/design-tokens";
import type {
  InsightCadence,
  InsightSeries,
} from "@/features/insights/fluida/contracts";
import { buildChartBars, selectSeriesValues } from "@/features/insights/fluida/series";
import { useBarGrowAnimation } from "@/shared/animations/use-bar-grow-animation";
import { maxValue } from "@/shared/utils/chart-geometry";
import { formatCurrency } from "@/shared/utils/formatters";

export interface ChartBeatProps {
  readonly series: InsightSeries;
  readonly cadence: InsightCadence;
  readonly testID?: string;
}

// Fixed internal coordinate space; the SVG scales to its container width.
const VIEWBOX_WIDTH = 320;
const CHART_HEIGHT = 90;
const MIN_BAR_HEIGHT = 4;
const BAR_GAP = 6;
const BAR_CORNER = 4;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface ChartBarRectProps {
  readonly x: number;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly index: number;
}

/**
 * A single rhythm-chart bar that grows up from the baseline to its final
 * `height` over ~0.5s, staggered by `index`. The grow animation lives in
 * {@link useBarGrowAnimation}; the rest state is the fully-drawn bar, so the
 * bar is never left stuck invisible (and honours "reduce motion").
 *
 * @param props The bar's x/width, final height, fill colour and row index.
 * @returns An animated `<Rect>` driven by the grow animation.
 */
function ChartBarRect({
  x,
  width,
  height,
  fill,
  index,
}: ChartBarRectProps): ReactElement {
  const { animatedProps } = useBarGrowAnimation({
    height,
    chartHeight: CHART_HEIGHT,
    index,
  });

  return (
    <AnimatedRect
      x={x}
      width={width}
      rx={BAR_CORNER}
      fill={fill}
      animatedProps={animatedProps}
    />
  );
}

const TITLE_BY_CADENCE: Record<InsightCadence, string> = {
  daily: "Saídas · últimos 7 dias",
  weekly: "Saídas · últimas 6 semanas",
};

/**
 * "O ritmo de saídas" chart beat: a titled card with a row of bars (7 days /
 * 6 weeks per cadence) drawn with `react-native-svg`. The peak bar is filled
 * with the danger token and its label echoes that colour; the others use the
 * muted track tokens. The legend shows the peak value formatted as BRL. Bar
 * sizing/peak detection is delegated to {@link buildChartBars} so the math is
 * unit-tested in isolation.
 *
 * @param props The outflow series, the active cadence and an optional id.
 * @returns The composed chart beat card.
 */
export function ChartBeat({ series, cadence, testID }: ChartBeatProps): ReactElement {
  const theme = useTheme();
  const bars = buildChartBars(series, cadence);
  const values = selectSeriesValues(series, cadence);
  const peak = maxValue(values);

  const peakColor = theme.danger?.val ?? "#000000";
  const trackColor = theme.backgroundPress?.val ?? theme.muted?.val ?? "#000000";

  const slot = VIEWBOX_WIDTH / Math.max(1, bars.length);
  const barWidth = Math.max(0, slot - BAR_GAP);

  return (
    <YStack
      gap="$3"
      padding="$4"
      borderRadius="$2"
      backgroundColor="$surfaceCard"
      borderWidth={borderWidths.hairline}
      borderColor="$borderColor"
      testID={testID}
    >
      <XStack alignItems="baseline" justifyContent="space-between" gap="$2">
        <Paragraph color="$color" fontFamily="$body" fontSize="$3" fontWeight="$7">
          {TITLE_BY_CADENCE[cadence]}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$1" fontWeight="$6">
          {`pico: ${formatCurrency(peak)}`}
        </Paragraph>
      </XStack>

      <Svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${CHART_HEIGHT}`}
      >
        {bars.map((bar, index) => {
          const barHeight = Math.max(MIN_BAR_HEIGHT, bar.ratio * CHART_HEIGHT);
          const x = slot * index + BAR_GAP / 2;
          return (
            <ChartBarRect
              key={bar.label}
              x={x}
              width={barWidth}
              height={barHeight}
              fill={bar.isPeak ? peakColor : trackColor}
              index={index}
            />
          );
        })}
      </Svg>

      <XStack justifyContent="space-between">
        {bars.map((bar) => (
          <Paragraph
            key={bar.label}
            color={bar.isPeak ? "$danger" : "$muted"}
            fontFamily="$body"
            fontSize="$1"
            fontWeight="$6"
            flex={1}
            textAlign="center"
          >
            {bar.label}
          </Paragraph>
        ))}
      </XStack>
    </YStack>
  );
}
