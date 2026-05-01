import type { ReactElement } from "react";

import { XStack } from "tamagui";

import {
  BRAPI_HISTORICAL_RANGES,
  type BrapiHistoricalRange,
} from "@/features/wallet/brapi-contracts";
import { AppButton } from "@/shared/components/app-button";

const RANGE_LABELS: Record<BrapiHistoricalRange, string> = {
  "1d": "1D",
  "5d": "5D",
  "1mo": "1M",
  "3mo": "3M",
  "6mo": "6M",
  "1y": "1A",
  "5y": "5A",
  max: "MAX",
};

export interface TickerRangeSelectorProps {
  readonly selectedRange: BrapiHistoricalRange;
  readonly onSelect: (range: BrapiHistoricalRange) => void;
  readonly disabled?: boolean;
}

/**
 * Range selector for the ticker historical chart.
 *
 * Renders the canonical BRAPI historical ranges as a row of toggle
 * buttons. Selection is fully controlled by the parent.
 */
export function TickerRangeSelector({
  selectedRange,
  onSelect,
  disabled = false,
}: TickerRangeSelectorProps): ReactElement {
  return (
    <XStack gap="$2" flexWrap="wrap" testID="ticker-range-selector">
      {BRAPI_HISTORICAL_RANGES.map((range) => {
        const isActive = range === selectedRange;
        return (
          <AppButton
            key={range}
            tone={isActive ? "primary" : "secondary"}
            disabled={disabled}
            onPress={() => onSelect(range)}
            testID={`ticker-range-${range}`}
          >
            {RANGE_LABELS[range]}
          </AppButton>
        );
      })}
    </XStack>
  );
}
