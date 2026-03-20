import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Paragraph, YStack, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";

const SurfaceFrame = styled(YStack, {
  backgroundColor: "$surfaceCard",
  borderColor: "$borderColor",
  borderWidth: borderWidths.hairline,
  borderRadius: "$2",
  padding: "$4",
  gap: "$2",
});

export interface AppSurfaceCardProps extends ComponentProps<typeof SurfaceFrame> {
  readonly title?: string
  readonly description?: string
  readonly children: ReactNode
}

/**
 * Shared card surface for mobile screens built on Tamagui.
 *
 * @param props Card props and optional heading copy.
 * @returns A themed card container.
 */
export function AppSurfaceCard({
  title,
  description,
  children,
  ...rest
}: AppSurfaceCardProps): ReactElement {
  return (
    <SurfaceFrame {...rest}>
      {title ? (
        <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
          {title}
        </Paragraph>
      ) : null}
      {description ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {description}
        </Paragraph>
      ) : null}
      {children}
    </SurfaceFrame>
  );
}
