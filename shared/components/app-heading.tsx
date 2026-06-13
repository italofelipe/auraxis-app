import type { ComponentProps, ReactElement, ReactNode } from "react";

import { H1, H2, H3 } from "tamagui";

export interface AppHeadingProps
  extends Omit<ComponentProps<typeof H2>, "children" | "display"> {
  readonly children: ReactNode;
  readonly level?: 1 | 2 | 3;
  /** Render como título de destaque (display) — H1 grande (32px). */
  readonly display?: boolean;
}

export function AppHeading({
  children,
  level = 2,
  display = false,
  ...rest
}: AppHeadingProps): ReactElement {
  if (display) {
    return (
      <H1 fontFamily="$heading" color="$color" fontSize="$9" {...rest}>
        {children}
      </H1>
    );
  }
  if (level === 1) {
    return (
      <H1 fontFamily="$heading" color="$color" {...rest}>
        {children}
      </H1>
    );
  }
  if (level === 3) {
    return (
      <H3 fontFamily="$heading" color="$color" {...rest}>
        {children}
      </H3>
    );
  }
  return (
    <H2 fontFamily="$heading" color="$color" {...rest}>
      {children}
    </H2>
  );
}
