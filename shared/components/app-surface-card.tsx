import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Paragraph, YStack, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { AppHeading } from "@/shared/components/app-heading";

// Cards de superfície com raio 20 + sombra suave — paridade com os cards
// brancos do dashboard web (border #D8E3EF + shadow card).
const SurfaceFrame = styled(YStack, {
  backgroundColor: "$surfaceCard",
  borderColor: "$borderColor",
  borderWidth: borderWidths.hairline,
  borderRadius: "$3",
  padding: "$5",
  gap: "$3",
  shadowColor: "#0A1628",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 16,
  elevation: 2,
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
        <AppHeading level={3} fontSize="$6">
          {title}
        </AppHeading>
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
