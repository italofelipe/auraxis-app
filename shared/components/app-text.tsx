import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Paragraph } from "tamagui";

export interface AppTextProps
  extends Omit<ComponentProps<typeof Paragraph>, "children" | "size"> {
  readonly children: ReactNode;
  readonly size?: "body" | "bodySm" | "caption";
  readonly tone?: "default" | "muted" | "danger" | "primary";
}

const sizeTokenMap: Record<NonNullable<AppTextProps["size"]>, "$2" | "$3" | "$4"> =
  {
    body: "$4",
    bodySm: "$3",
    caption: "$2",
  };

const toneTokenMap: Record<
  NonNullable<AppTextProps["tone"]>,
  "$color" | "$muted" | "$danger" | "$secondary"
> = {
  default: "$color",
  muted: "$muted",
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
