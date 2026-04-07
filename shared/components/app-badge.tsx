import type { ReactElement, ReactNode } from "react";

import { Paragraph, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";

const BadgeFrame = styled(Paragraph, {
  alignSelf: "flex-start",
  backgroundColor: "$surfaceRaised",
  borderColor: "$borderColor",
  borderRadius: "$4",
  borderWidth: borderWidths.hairline,
  color: "$color",
  fontFamily: "$body",
  fontSize: "$2",
  paddingHorizontal: "$2",
  paddingVertical: "$1",
});

export interface AppBadgeProps {
  readonly children: ReactNode;
  readonly tone?: "default" | "primary" | "danger";
}

export function AppBadge({
  children,
  tone = "default",
}: AppBadgeProps): ReactElement {
  const toneProps =
    tone === "primary"
      ? { backgroundColor: "$secondary", color: "$background" }
      : tone === "danger"
        ? { backgroundColor: "$danger", color: "$color" }
        : undefined;

  return <BadgeFrame {...toneProps}>{children}</BadgeFrame>;
}
