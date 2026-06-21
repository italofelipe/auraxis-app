import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { borderWidths, letterSpacings } from "@/config/design-tokens";
import type { InsightHighlight } from "@/features/insights/fluida/contracts";

export interface PullStatProps {
  readonly highlight: InsightHighlight;
  /** Colour token for the accent left border. Defaults to the brand primary. */
  readonly accentToken?: `$${string}`;
  readonly testID?: string;
}

/**
 * Pull-stat: a numeric highlight rendered like a pull-quote — an uppercase
 * muted label, a large mono value (IBM Plex Mono, tabular figures) and a
 * one-line sub-caption — with a coloured accent border on the left edge. The
 * value string is rendered verbatim (the mock already carries BRL/percent),
 * so this stays presentational. All colours/fonts come from theme tokens.
 *
 * @param props The highlight to render, the accent token and an optional id.
 * @returns The composed pull-stat block.
 */
export function PullStat({
  highlight,
  accentToken = "$primary",
  testID,
}: PullStatProps): ReactElement {
  return (
    <YStack
      gap="$1"
      paddingLeft="$3"
      borderLeftWidth={3 * borderWidths.hairline}
      borderColor={accentToken}
      testID={testID}
    >
      <Paragraph
        color="$muted"
        fontFamily="$body"
        fontSize="$1"
        fontWeight="$7"
        letterSpacing={letterSpacings.caps}
        textTransform="uppercase"
      >
        {highlight.label}
      </Paragraph>
      <Paragraph
        color="$color"
        fontFamily="$mono"
        fontSize="$8"
        fontWeight="$6"
        fontVariant={["tabular-nums"]}
        testID="pull-stat-value"
      >
        {highlight.value}
      </Paragraph>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3" fontWeight="$6">
        {highlight.sub}
      </Paragraph>
    </YStack>
  );
}
