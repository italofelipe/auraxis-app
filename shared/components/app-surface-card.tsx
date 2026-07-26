import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Paragraph, YStack, styled } from "tamagui";

import { borderWidths, radii } from "@/config/design-tokens";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { AppHeading } from "@/shared/components/app-heading";
import {
  darkSemanticGlows,
  lightSemanticGlows,
  semanticShadows,
} from "@/shared/theme";

// Superfícies Apple-like: card plano por padrão, raio moderado e hairline.
// Sombra só aparece nas variantes elevadas/overlay, sempre pelos tokens.
const SurfaceFrame = styled(YStack, {
  backgroundColor: "$surfaceCard",
  borderColor: "$borderColor",
  borderWidth: borderWidths.hairline,
  borderRadius: radii.md,
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

export type AppSurfaceCardVariant = "flat" | "raised" | "overlay";

export interface AppSurfaceCardProps
  extends ComponentProps<typeof SurfaceFrame> {
  readonly title?: string;
  readonly description?: string;
  /** Hierarquia visual: `flat` (padrão), `raised` ou `overlay`. */
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
 * Variantes dão hierarquia visual. Passar `onPress` ativa press-scale e
 * realce de borda sem transformar a superfície em um card excessivamente
 * elevado.
 *
 * @param props Card props, copy opcional e variante.
 * @returns A themed card container.
 */
export function AppSurfaceCard({
  title,
  description,
  variant = "flat",
  glow = false,
  accentBar = false,
  onPress,
  children,
  ...rest
}: AppSurfaceCardProps): ReactElement {
  const resolvedTheme = useResolvedTheme();
  const glows =
    resolvedTheme === "auraxis_dark" ? darkSemanticGlows : lightSemanticGlows;
  const isInteractive = typeof onPress === "function";
  const shadow =
    variant === "raised"
      ? semanticShadows.raised
      : variant === "overlay"
        ? semanticShadows.overlay
        : semanticShadows.none;
  const shape =
    variant === "overlay"
      ? {
          borderRadius: radii.none,
          borderTopLeftRadius: radii.sheet,
          borderTopRightRadius: radii.sheet,
        }
      : { borderRadius: radii.md };

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
      {...shape}
      {...resolveCardGlow(glow, glows)}
      {...interactiveProps}
    >
      <CardContent accentBar={accentBar} title={title} description={description}>
        {children}
      </CardContent>
    </SurfaceFrame>
  );
}
