import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Paragraph, YStack, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { AppHeading } from "@/shared/components/app-heading";
import {
  darkSemanticGlows,
  lightSemanticGlows,
  semanticShadows,
} from "@/shared/theme";

// Cards de superfície com raio 20 + sombra suave — paridade com os cards
// brancos do dashboard web (border #D8E3EF + shadow card). A sombra agora
// vem do token `semanticShadows` por variante (base/raised) e o glow é uma
// sombra colorida de marca (OTA-able, sem blur nativo).
const SurfaceFrame = styled(YStack, {
  backgroundColor: "$surfaceCard",
  borderColor: "$borderColor",
  borderWidth: borderWidths.hairline,
  borderRadius: "$3",
  padding: "$5",
  gap: "$3",
});

const AccentBar = styled(YStack, {
  height: 4,
  width: 40,
  borderRadius: "$5",
  backgroundColor: "$primary",
  marginBottom: "$2",
});

type CardGlow = (typeof lightSemanticGlows)["brandSoft"];

export type AppSurfaceCardVariant = "base" | "raised" | "interactive";

export interface AppSurfaceCardProps
  extends ComponentProps<typeof SurfaceFrame> {
  readonly title?: string;
  readonly description?: string;
  /** Hierarquia visual: `base` (sombra suave), `raised` (destacado), `interactive` (pressionável). */
  readonly variant?: AppSurfaceCardVariant;
  /** Glow de marca (sombra colorida) — substitui a sombra neutra. */
  readonly glow?: boolean;
  /** Barra de destaque no topo, na cor primária. */
  readonly accentBar?: boolean;
  readonly children: ReactNode;
}

const resolveCardGlow = (
  glow: boolean,
  glows: typeof lightSemanticGlows,
): CardGlow | Record<string, never> => {
  return glow ? glows.brandSoft : {};
};

interface CardContentProps {
  readonly accentBar: boolean;
  readonly title?: string;
  readonly description?: string;
  readonly children: ReactNode;
}

function CardContent({
  accentBar,
  title,
  description,
  children,
}: CardContentProps): ReactElement {
  return (
    <>
      {accentBar ? <AccentBar /> : null}
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
    </>
  );
}

/**
 * Shared card surface for mobile screens built on Tamagui.
 *
 * Variantes dão hierarquia visual; `interactive` (ou passar `onPress`) ativa
 * um press-scale via `pressStyle` (sem wrapper, preservando o layout) e
 * realce de borda.
 *
 * @param props Card props, copy opcional e variante.
 * @returns A themed card container.
 */
export function AppSurfaceCard({
  title,
  description,
  variant = "base",
  glow = false,
  accentBar = false,
  onPress,
  children,
  ...rest
}: AppSurfaceCardProps): ReactElement {
  const resolvedTheme = useResolvedTheme();
  const glows =
    resolvedTheme === "auraxis_dark" ? darkSemanticGlows : lightSemanticGlows;
  const isInteractive =
    variant === "interactive" || typeof onPress === "function";
  const shadow =
    variant === "raised" ? semanticShadows.raised : semanticShadows.card;

  const interactiveProps = isInteractive
    ? {
        onPress,
        pressStyle: { borderColor: "$borderColorHover", scale: 0.98 },
      }
    : {};

  return (
    <SurfaceFrame
      {...rest}
      {...shadow}
      {...resolveCardGlow(glow, glows)}
      {...interactiveProps}
    >
      <CardContent accentBar={accentBar} title={title} description={description}>
        {children}
      </CardContent>
    </SurfaceFrame>
  );
}
