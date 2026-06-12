import { createFont, createTamagui, createTokens } from "tamagui";

import {
  darkSemanticColors,
  fontSizes,
  lightSemanticColors,
  semanticRadii,
  semanticSpacing,
} from "@/shared/theme";

const bodyFont = createFont({
  family: "Inter_400Regular",
  size: {
    1: fontSizes.xs,
    2: fontSizes.sm,
    3: fontSizes.md,
    4: fontSizes.base,
    5: fontSizes.lg,
    6: fontSizes.xl,
    7: fontSizes["2xl"],
    8: fontSizes["3xl"],
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 20,
    4: 22,
    5: 24,
    6: 28,
    7: 32,
    8: 36,
  },
  weight: {
    4: "400",
    5: "500",
    6: "600",
    7: "700",
  },
  face: {
    400: { normal: "Inter_400Regular" },
    500: { normal: "Inter_500Medium" },
    600: { normal: "Inter_600SemiBold" },
    700: { normal: "Inter_700Bold" },
  },
});

const headingFont = createFont({
  family: "Inter_700Bold",
  size: {
    4: fontSizes.base,
    5: fontSizes.lg,
    6: fontSizes.xl,
    7: fontSizes["2xl"],
    8: fontSizes["3xl"],
    9: fontSizes["4xl"],
  },
  lineHeight: {
    4: 22,
    5: 24,
    6: 28,
    7: 32,
    8: 36,
    9: 42,
  },
  weight: {
    6: "600",
    7: "700",
  },
  face: {
    600: { normal: "Inter_600SemiBold" },
    700: { normal: "Inter_700Bold" },
  },
});

// Valores financeiros (R$) — assinatura visual do dashboard web.
const monoFont = createFont({
  family: "IBMPlexMono_500Medium",
  size: {
    1: fontSizes.xs,
    2: fontSizes.sm,
    3: fontSizes.md,
    4: fontSizes.base,
    5: fontSizes.lg,
    6: fontSizes.xl,
    7: fontSizes["2xl"],
    8: fontSizes["3xl"],
    9: fontSizes["4xl"],
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 20,
    4: 22,
    5: 24,
    6: 28,
    7: 32,
    8: 38,
    9: 44,
  },
  weight: {
    4: "400",
    5: "500",
    6: "600",
  },
  face: {
    400: { normal: "IBMPlexMono_400Regular" },
    500: { normal: "IBMPlexMono_500Medium" },
    600: { normal: "IBMPlexMono_600SemiBold" },
  },
});

const tokens = createTokens({
  color: {
    // Mantidos para consumo direto via $token quando necessário.
    brandPrimaryDark: darkSemanticColors.primary,
    brandPrimaryLight: lightSemanticColors.primary,
    surfaceBaseDark: darkSemanticColors.background,
    surfaceBaseLight: lightSemanticColors.background,
  },
  space: {
    0: 0,
    1: semanticSpacing.xxs,
    2: semanticSpacing.xs,
    3: semanticSpacing.sm,
    4: semanticSpacing.md,
    5: semanticSpacing.lg,
    6: semanticSpacing.xl,
    7: semanticSpacing["2xl"],
    8: semanticSpacing["3xl"],
  },
  size: {
    0: 0,
    1: 28,
    2: 32,
    3: 36,
    4: 40,
    5: 44,
    6: 52,
    7: 60,
    8: 72,
  },
  radius: {
    0: 0,
    1: semanticRadii.sm,
    2: semanticRadii.md,
    3: semanticRadii.lg,
    4: semanticRadii.xl,
    5: semanticRadii.pill,
  },
  zIndex: {
    0: 0,
    1: 10,
    2: 20,
    3: 30,
  },
});

type SemanticColors = Record<keyof typeof lightSemanticColors, string>;

/**
 * Constrói o tema com VALORES CONCRETOS (hex/rgba).
 *
 * Regressão #539/#543: a versão anterior populava os temas com referências
 * de token ("$brandPrimaryLight") que o resolvedor do Tamagui nunca
 * converteu para cor — o RN recebia a string crua e o app inteiro
 * renderizava sem cor. Temas devem carregar valores finais; o teste
 * `shared/theme/theme-resolution.test.tsx` protege este contrato.
 */
const buildModeTheme = (palette: SemanticColors) => {
  return {
    background: palette.background,
    backgroundHover: palette.surface,
    backgroundPress: palette.surfaceRaised,
    backgroundFocus: palette.surfaceRaised,
    color: palette.foreground,
    colorHover: palette.foreground,
    colorPress: palette.foreground,
    colorFocus: palette.foreground,
    borderColor: palette.border,
    borderColorHover: palette.borderStrong,
    borderColorFocus: palette.borderStrong,
    borderColorPress: palette.primary,
    placeholderColor: palette.subduedForeground,
    outlineColor: palette.primary,
    primary: palette.primary,
    primaryPressed: palette.primaryPressed,
    actionPrimaryForeground: palette.primaryForeground,
    secondary: palette.secondary,
    secondaryPressed: palette.secondaryPressed,
    accentColor: palette.primary,
    surfaceCard: palette.surface,
    surfaceRaised: palette.surfaceRaised,
    muted: palette.mutedForeground,
    success: palette.success,
    danger: palette.danger,
    dangerStrong: palette.dangerStrong,
    warning: palette.warning,
    info: palette.info,
  } as const;
};

const auraxisLightTheme = buildModeTheme(lightSemanticColors);
const auraxisDarkTheme = buildModeTheme(darkSemanticColors);

export const auraxisThemes = {
  auraxis: auraxisLightTheme,
  auraxis_dark: auraxisDarkTheme,
  auraxis_light: auraxisLightTheme,
} as const;

export type AuraxisThemeName = keyof typeof auraxisThemes;
export const auraxisDefaultTheme = "auraxis_light" satisfies AuraxisThemeName;

export const tamaguiConfig = createTamagui({
  tokens,
  themes: auraxisThemes,
  fonts: {
    body: bodyFont,
    heading: headingFont,
    mono: monoFont,
  },
  defaultTheme: auraxisDefaultTheme,
  settings: {
    shouldAddPrefersColorThemes: false,
    allowedStyleValues: "somewhat-strict-web",
  },
});

export type AppTamaguiConfig = typeof tamaguiConfig;
