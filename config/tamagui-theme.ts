import { createFont, createTamagui, createTokens } from "tamagui";

import {
  fontSizes,
  semanticColors,
  semanticRadii,
  semanticSpacing,
} from "@/shared/theme";

const bodyFont = createFont({
  family: "Raleway_400Regular",
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
    400: { normal: "Raleway_400Regular" },
    500: { normal: "Raleway_500Medium" },
    600: { normal: "Raleway_600SemiBold" },
  },
});

const headingFont = createFont({
  family: "PlayfairDisplay_700Bold",
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
    9: 40,
  },
  weight: {
    6: "600",
    7: "700",
  },
  face: {
    600: { normal: "PlayfairDisplay_600SemiBold" },
    700: { normal: "PlayfairDisplay_700Bold" },
  },
});

const tokens = createTokens({
  color: {
    surfaceBase: semanticColors.background,
    surfaceCard: semanticColors.surface,
    surfaceRaised: semanticColors.surfaceRaised,
    brandPrimary: semanticColors.primary,
    brandSecondary: semanticColors.secondary,
    brandHighlight: semanticColors.mutedForeground,
    textPrimary: semanticColors.foreground,
    textSecondary: semanticColors.mutedForeground,
    textMuted: semanticColors.subduedForeground,
    borderMuted: semanticColors.border,
    success: semanticColors.success,
    danger: semanticColors.danger,
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
  },
  zIndex: {
    0: 0,
    1: 10,
    2: 20,
    3: 30,
  },
});

const themes = {
  auraxis: {
    background: "$surfaceBase",
    backgroundHover: "$surfaceCard",
    backgroundPress: "$surfaceRaised",
    backgroundFocus: "$surfaceRaised",
    color: "$textPrimary",
    colorHover: "$textPrimary",
    colorPress: "$textPrimary",
    colorFocus: "$textPrimary",
    borderColor: "$borderMuted",
    borderColorHover: "$brandSecondary",
    borderColorFocus: "$brandSecondary",
    borderColorPress: "$brandPrimary",
    placeholderColor: "$textMuted",
    outlineColor: "$brandPrimary",
    primary: "$brandPrimary",
    secondary: "$brandSecondary",
    accentColor: "$brandHighlight",
    surfaceCard: "$surfaceCard",
    surfaceRaised: "$surfaceRaised",
    muted: "$textMuted",
    success: "$success",
    danger: "$danger",
  },
} as const;

export const tamaguiConfig = createTamagui({
  tokens,
  themes,
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  defaultTheme: "auraxis",
  settings: {
    shouldAddPrefersColorThemes: false,
    allowedStyleValues: "somewhat-strict-web",
  },
});

export type AppTamaguiConfig = typeof tamaguiConfig
