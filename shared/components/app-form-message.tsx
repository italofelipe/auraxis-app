import type { ReactElement } from "react";

import { Paragraph } from "tamagui";

export interface AppFormMessageProps {
  readonly tone?: "muted" | "danger";
  readonly text: string;
}

export function AppFormMessage({
  tone = "muted",
  text,
}: AppFormMessageProps): ReactElement {
  return (
    <Paragraph
      color={tone === "danger" ? "$danger" : "$muted"}
      fontFamily="$body"
      fontSize="$2">
      {text}
    </Paragraph>
  );
}
