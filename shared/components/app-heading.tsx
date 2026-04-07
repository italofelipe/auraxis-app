import type { ComponentProps, ReactElement, ReactNode } from "react";

import { H1, H2, H3 } from "tamagui";

export interface AppHeadingProps extends Omit<ComponentProps<typeof H2>, "children"> {
  readonly children: ReactNode;
  readonly level?: 1 | 2 | 3;
}

export function AppHeading({
  children,
  level = 2,
  ...rest
}: AppHeadingProps): ReactElement {
  if (level === 1) {
    return <H1 fontFamily="$heading" color="$color" {...rest}>{children}</H1>;
  }

  if (level === 3) {
    return <H3 fontFamily="$heading" color="$color" {...rest}>{children}</H3>;
  }

  return <H2 fontFamily="$heading" color="$color" {...rest}>{children}</H2>;
}
