import type { ReactElement } from "react";

import { Paragraph, XStack } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import type { InsightSeverity } from "@/features/insights/fluida/contracts";
import { resolveSeverityVisual } from "@/features/insights/fluida/severity";

export interface SevChipProps {
  readonly severity: InsightSeverity;
  readonly testID?: string;
}

/**
 * Severity chip for the editorial lead. Renders a pill tinted by the
 * severity (ok=green, attention=amber, alert=red), with the label and a
 * leading dot in the matching colour. All colours come from theme tokens
 * so light/dark resolve automatically.
 *
 * @param props Severity to render and optional test id.
 * @returns A coloured severity pill.
 */
export function SevChip({ severity, testID }: SevChipProps): ReactElement {
  const visual = resolveSeverityVisual(severity);

  return (
    <XStack
      alignItems="center"
      gap="$1"
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$5"
      borderWidth={borderWidths.hairline}
      backgroundColor={visual.tintToken}
      borderColor={visual.colorToken}
      alignSelf="flex-start"
      accessibilityRole="text"
      accessibilityLabel={`Severidade: ${visual.label}`}
      testID={testID}
    >
      <Paragraph color={visual.colorToken} fontFamily="$body" fontSize="$1" fontWeight="$7">
        {visual.label}
      </Paragraph>
    </XStack>
  );
}
