import type { ComponentProps, ReactElement } from "react";

import { XStack, YStack } from "tamagui";

export interface AppStackProps extends ComponentProps<typeof YStack> {
  readonly axis?: "vertical" | "horizontal";
}

export function AppStack({
  axis = "vertical",
  ...rest
}: AppStackProps): ReactElement {
  if (axis === "horizontal") {
    return <XStack {...rest} />;
  }

  return <YStack {...rest} />;
}
