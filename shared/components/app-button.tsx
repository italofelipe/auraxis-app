import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Button, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";

const PrimaryButtonFrame = styled(Button, {
  backgroundColor: "$secondary",
  borderRadius: "$1",
  pressStyle: {
    backgroundColor: "$primary",
  },
});

const SecondaryButtonFrame = styled(Button, {
  backgroundColor: "transparent",
  borderRadius: "$1",
  borderColor: "$secondary",
  borderWidth: borderWidths.hairline,
  pressStyle: {
    backgroundColor: "$surfaceRaised",
  },
});

export interface AppButtonProps
  extends Omit<ComponentProps<typeof PrimaryButtonFrame>, "children"> {
  readonly children: ReactNode
  readonly tone?: "primary" | "secondary"
}

/**
 * Shared button wrapper aligned to the Auraxis Tamagui theme.
 *
 * @param props Button content and behavioral props.
 * @returns Primary or secondary mobile button.
 */
export function AppButton({
  children,
  tone = "primary",
  ...rest
}: AppButtonProps): ReactElement {
  if (tone === "secondary") {
    return <SecondaryButtonFrame {...rest}>{children}</SecondaryButtonFrame>;
  }

  return <PrimaryButtonFrame {...rest}>{children}</PrimaryButtonFrame>;
}
