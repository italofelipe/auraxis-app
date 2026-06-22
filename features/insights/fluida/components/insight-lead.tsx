import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { letterSpacings } from "@/config/design-tokens";
import type { InsightLeadVM } from "@/features/insights/fluida/contracts";
import { ReadTime } from "@/features/insights/fluida/components/read-time";
import { SevChip } from "@/features/insights/fluida/components/sev-chip";
import { getInsightDimensionLabel } from "@/features/insights/hooks/use-insights-by-dimension";

export interface InsightLeadProps {
  readonly lead: InsightLeadVM;
}

/**
 * Editorial lead block of the "Fluida" screen: a kicker (theme name in
 * uppercase) with the severity chip and reading-time badge, a serif
 * headline (Newsreader) and the opening paragraph (Inter). Presentational
 * — the lead VM is derived by the screen controller.
 *
 * @param props The lead view model to render.
 * @returns The composed lead block.
 */
export function InsightLead({ lead }: InsightLeadProps): ReactElement {
  return (
    <YStack gap="$3" testID="insight-lead">
      <XStack alignItems="center" justifyContent="space-between" gap="$2" flexWrap="wrap">
        <XStack alignItems="center" gap="$2" flexShrink={1}>
          <Paragraph
            color="$primary"
            fontFamily="$body"
            fontSize="$1"
            fontWeight="$7"
            letterSpacing={letterSpacings.caps}
            textTransform="uppercase"
          >
            {getInsightDimensionLabel(lead.dimension)}
          </Paragraph>
          <SevChip severity={lead.severity} />
        </XStack>
        <ReadTime readMinutes={lead.readMinutes} />
      </XStack>

      <Paragraph
        color="$color"
        fontFamily="$serif"
        fontSize="$8"
        fontWeight="$6"
        lineHeight="$8"
        testID="insight-lead-headline"
      >
        {lead.title}
      </Paragraph>

      <Paragraph color="$color" fontFamily="$body" fontSize="$4" lineHeight="$5">
        {lead.lead}
      </Paragraph>
    </YStack>
  );
}
