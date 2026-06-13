import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Paragraph } from "tamagui";

export interface AppTextProps
  extends Omit<ComponentProps<typeof Paragraph>, "children" | "size"> {
  readonly children: ReactNode;
  readonly size?: "bodyLg" | "body" | "bodySm" | "caption";
  readonly tone?: "default" | "muted" | "subdued" | "danger" | "primary";
}

const sizeTokenMap: Record<
  NonNullable<AppTextProps["size"]>,
  "$2" | "$3" | "$4" | "$5"
> = {
  bodyLg: "$5",
  body: "$4",
  bodySm: "$3",
  caption: "$2",
};

const toneTokenMap: Record<
  NonNullable<AppTextProps["tone"]>,
  "$color" | "$muted" | "$subdued" | "$danger" | "$secondary"
> = {
  default: "$color",
  muted: "$muted",
  subdued: "$subdued",
  danger: "$danger",
  primary: "$secondary",
};

export function AppText({
  children,
  size = "body",
  tone = "default",
  ...rest
}: AppTextProps): ReactElement {
  return (
    <Paragraph
      color={toneTokenMap[tone]}
      fontFamily="$body"
      fontSize={sizeTokenMap[size]}
      {...rest}
    >
      {children}
    </Paragraph>
  );
}
