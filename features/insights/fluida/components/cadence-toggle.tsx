import type { ReactElement } from "react";

import { Paragraph, XStack } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import type { InsightCadence } from "@/features/insights/fluida/contracts";
import type { InsightCadenceOption } from "@/features/insights/hooks/use-insights-fluida-screen-controller";

export interface CadenceToggleProps {
  readonly options: readonly InsightCadenceOption[];
  readonly value: InsightCadence;
  readonly onChange: (value: InsightCadence) => void;
  readonly testID?: string;
}

/**
 * Segmented control for the reading cadence (Diário / Semanal) in the
 * masthead. The active segment gets a raised surface and primary text;
 * the inactive one stays muted. Presentational — state arrives via props.
 *
 * @param props Cadence options, the active value and a change handler.
 * @returns A two-option segmented control.
 */
export function CadenceToggle({
  options,
  value,
  onChange,
  testID,
}: CadenceToggleProps): ReactElement {
  return (
    <XStack
      backgroundColor="$surfaceRaised"
      borderRadius="$2"
      borderWidth={borderWidths.hairline}
      borderColor="$borderColor"
      padding="$1"
      gap="$1"
      testID={testID ?? "insights-cadence-toggle"}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <XStack
            key={option.value}
            flex={1}
            alignItems="center"
            justifyContent="center"
            paddingVertical="$2"
            paddingHorizontal="$3"
            borderRadius="$1"
            backgroundColor={isActive ? "$surfaceCard" : "transparent"}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option.label}
            testID={`insights-cadence-${option.value}`}
            pressStyle={{ opacity: 0.85 }}
            onPress={() => {
              triggerHapticImpact("light");
              onChange(option.value);
            }}
          >
            <Paragraph
              fontFamily="$body"
              fontSize="$3"
              fontWeight={isActive ? "$7" : "$5"}
              color={isActive ? "$primary" : "$muted"}
            >
              {option.label}
            </Paragraph>
          </XStack>
        );
      })}
    </XStack>
  );
}
