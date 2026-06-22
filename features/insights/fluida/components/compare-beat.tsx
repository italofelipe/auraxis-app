import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { borderWidths, letterSpacings } from "@/config/design-tokens";
import type { InsightRetroItem } from "@/features/insights/fluida/contracts";
import { BeatKicker } from "@/features/insights/fluida/components/beat-kicker";
import { formatSignedAmount, resolveSignColorToken } from "@/features/insights/fluida/sign";

export interface CompareBeatProps {
  readonly items: readonly InsightRetroItem[];
  readonly testID?: string;
}

/**
 * "Como se compara" beat: the kicker header plus a stack of comparative cards
 * (ontem · anteontem · vs. semana). Each card has a coloured accent border on
 * its left edge, an uppercase muted label, the signed value in the mono face
 * (coloured by sign) and a short caption. Renders nothing when there are no
 * items, so non-general dimensions simply omit the beat.
 *
 * @param props The comparative items and an optional test id.
 * @returns The composed compare beat, or `null` when empty.
 */
export function CompareBeat({ items, testID }: CompareBeatProps): ReactElement | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <YStack gap="$3" testID={testID}>
      <BeatKicker icon="clock-outline" label="Como se compara" />

      <YStack gap="$2">
        {items.map((item) => {
          const colorToken = resolveSignColorToken(item.sign);
          return (
            <YStack
              key={item.key}
              gap="$1"
              padding="$3"
              borderRadius="$2"
              backgroundColor="$surfaceCard"
              borderLeftWidth={3 * borderWidths.hairline}
              borderColor={colorToken}
            >
              <Paragraph
                color="$muted"
                fontFamily="$body"
                fontSize="$1"
                fontWeight="$7"
                letterSpacing={letterSpacings.caps}
                textTransform="uppercase"
              >
                {item.label}
              </Paragraph>
              <Paragraph
                color={colorToken}
                fontFamily="$mono"
                fontSize="$5"
                fontWeight="$6"
                fontVariant={["tabular-nums"]}
                testID={`compare-value-${item.key}`}
              >
                {formatSignedAmount(item.value, item.sign)}
              </Paragraph>
              <Paragraph color="$color" fontFamily="$body" fontSize="$2" lineHeight="$2">
                {item.caption}
              </Paragraph>
            </YStack>
          );
        })}
      </YStack>
    </YStack>
  );
}
