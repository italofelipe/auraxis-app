import type { ReactElement } from "react";

import { Paragraph, Text } from "tamagui";

export interface TextBeatProps {
  /** The paragraph copy. */
  readonly children: string;
  /**
   * When set, the first character renders as a serif drop cap (the opening
   * flourish of the editorial reading). Only the first paragraph uses it.
   */
  readonly dropCap?: boolean;
  /** Colour token for the drop cap. Defaults to the brand primary. */
  readonly dropCapToken?: `$${string}`;
  readonly testID?: string;
}

/**
 * A short body paragraph of the "Fluida" reading. When `dropCap` is set the
 * first letter is rendered as an enlarged serif (Newsreader) initial inlined
 * before the rest of the copy — React Native has no CSS float, so the cap
 * sits inline with a tighter size rather than wrapping text around it. Body
 * copy uses the Inter face and the muted reading colour; everything is
 * token-driven.
 *
 * @param props The paragraph text plus optional drop-cap controls.
 * @returns The composed text beat.
 */
export function TextBeat({
  children,
  dropCap = false,
  dropCapToken = "$primary",
  testID,
}: TextBeatProps): ReactElement {
  const showCap = dropCap && children.length > 0;
  const cap = showCap ? children.slice(0, 1) : "";
  const rest = showCap ? children.slice(1) : children;

  return (
    <Paragraph
      color="$color"
      fontFamily="$body"
      fontSize="$4"
      lineHeight="$5"
      testID={testID}
    >
      {showCap ? (
        <Text
          color={dropCapToken}
          fontFamily="$serif"
          fontSize="$9"
          fontWeight="$6"
          testID="text-beat-dropcap"
        >
          {cap}
        </Text>
      ) : null}
      {rest}
    </Paragraph>
  );
}
