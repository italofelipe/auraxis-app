import type { ReactElement, ReactNode } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

export interface AppKeyValueRowProps {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly helperText?: ReactNode;
}

function renderTextNode(
  node: ReactNode,
  color: "$color" | "$muted",
  size: "$2" | "$3" | "$4",
): ReactElement | ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return (
      <Paragraph color={color} fontFamily="$body" fontSize={size}>
        {node}
      </Paragraph>
    );
  }

  return node;
}

/**
 * Shared key/value row used across wallet, subscription and planning summaries.
 *
 * @param props Label, value and optional helper copy.
 * @returns A two-column semantic row with consistent typography.
 */
export function AppKeyValueRow({
  label,
  value,
  helperText,
}: AppKeyValueRowProps): ReactElement {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$3">
      <YStack flex={1} gap="$1">
        {renderTextNode(label, "$muted", "$3")}
        {helperText ? renderTextNode(helperText, "$muted", "$2") : null}
      </YStack>
      {renderTextNode(value, "$color", "$4")}
    </XStack>
  );
}
