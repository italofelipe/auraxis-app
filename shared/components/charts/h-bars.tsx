import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppText } from "@/shared/components/app-text";
import { formatCurrency } from "@/shared/utils/formatters";
import { fillRatio, maxValue } from "@/shared/utils/chart-geometry";

/** A single bar row: id, label, colour and value. */
export interface HBarsDatum {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly value: number;
}

export interface HBarsProps {
  readonly data: readonly HBarsDatum[];
  /** Reference maximum; defaults to the largest value in `data`. */
  readonly max?: number;
  /** Formats the trailing value; defaults to BRL currency. */
  readonly formatValue?: (value: number) => string;
  /** Width token for the leading label column. */
  readonly labelWidth?: number;
  readonly testID?: string;
}

const DEFAULT_LABEL_WIDTH = 96;

/**
 * Horizontal bar list built from pure Tamagui Views (no SVG). Each row is a
 * colour dot, a fixed-width label, a track with a proportionally filled bar,
 * and the formatted value. Bar widths are percentages of the row width so they
 * reflow with the container.
 *
 * @param props Rows plus optional max, value formatter and label width.
 * @returns The horizontal bar chart.
 */
export function HBars({
  data,
  max,
  formatValue = formatCurrency,
  labelWidth = DEFAULT_LABEL_WIDTH,
  testID,
}: HBarsProps): ReactElement {
  const referenceMax = max ?? maxValue(data.map((datum) => datum.value));

  return (
    <YStack gap="$3" testID={testID}>
      {data.map((datum) => {
        const ratio = fillRatio(datum.value, referenceMax);
        const widthPercent = `${ratio * 100}%` as const;
        return (
          <XStack key={datum.id} alignItems="center" gap="$2">
            <YStack
              width={10}
              height={10}
              borderRadius="$5"
              backgroundColor={datum.color}
            />
            <YStack width={labelWidth}>
              <AppText size="bodySm" numberOfLines={1}>
                {datum.label}
              </AppText>
            </YStack>
            <YStack
              flex={1}
              height={8}
              borderRadius="$5"
              backgroundColor="$surfaceRaised"
              overflow="hidden"
            >
              <YStack
                height="100%"
                width={widthPercent}
                borderRadius="$5"
                backgroundColor={datum.color}
              />
            </YStack>
            <AppMoneyText fontSize="$3">{formatValue(datum.value)}</AppMoneyText>
          </XStack>
        );
      })}
    </YStack>
  );
}
