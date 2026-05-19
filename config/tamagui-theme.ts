import { createFont, createTamagui, createTokens } from "tamagui";

import {
  darkSemanticColors,
  fontSizes,
  lightSemanticColors,
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

// Token names are namespaced with -dark / -light suffixes so each Tamagui
// theme can resolve a specific colour while components reference the
// semantic Tamagui variable (e.g. `$background`).
const tokens = createTokens({
  color: {
    // dark
    surfaceBaseDark: darkSemanticColors.background,
    surfaceCardDark: darkSemanticColors.surface,
    surfaceRaisedDark: darkSemanticColors.surfaceRaised,
    textPrimaryDark: darkSemanticColors.foreground,
    textSecondaryDark: darkSemanticColors.mutedForeground,
    textMutedDark: darkSemanticColors.subduedForeground,
    borderMutedDark: darkSemanticColors.border,
    borderStrongDark: darkSemanticColors.borderStrong,
    brandPrimaryDark: darkSemanticColors.primary,
    brandPrimaryPressedDark: darkSemanticColors.primaryPressed,
    brandPrimaryForegroundDark: darkSemanticColors.primaryForeground,
    brandSecondaryDark: darkSemanticColors.secondary,
    brandSecondaryPressedDark: darkSemanticColors.secondaryPressed,
    successDark: darkSemanticColors.success,
    dangerDark: darkSemanticColors.danger,
    dangerStrongDark: darkSemanticColors.dangerStrong,
    warningDark: darkSemanticColors.warning,
    infoDark: darkSemanticColors.info,
    // light
    surfaceBaseLight: lightSemanticColors.background,
    surfaceCardLight: lightSemanticColors.surface,
    surfaceRaisedLight: lightSemanticColors.surfaceRaised,
    textPrimaryLight: lightSemanticColors.foreground,
    textSecondaryLight: lightSemanticColors.mutedForeground,
    textMutedLight: lightSemanticColors.subduedForeground,
    borderMutedLight: lightSemanticColors.border,
    borderStrongLight: lightSemanticColors.borderStrong,
    brandPrimaryLight: lightSemanticColors.primary,
    brandPrimaryPressedLight: lightSemanticColors.primaryPressed,
    brandPrimaryForegroundLight: lightSemanticColors.primaryForeground,
    brandSecondaryLight: lightSemanticColors.secondary,
    brandSecondaryPressedLight: lightSemanticColors.secondaryPressed,
    successLight: lightSemanticColors.success,
    dangerLight: lightSemanticColors.danger,
    dangerStrongLight: lightSemanticColors.dangerStrong,
    warningLight: lightSemanticColors.warning,
    infoLight: lightSemanticColors.info,
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

const buildModeTheme = (mode: "dark" | "light") => {
  const suffix = mode === "dark" ? "Dark" : "Light";
  return {
    background: `$surfaceBase${suffix}`,
    backgroundHover: `$surfaceCard${suffix}`,
    backgroundPress: `$surfaceRaised${suffix}`,
    backgroundFocus: `$surfaceRaised${suffix}`,
    color: `$textPrimary${suffix}`,
    colorHover: `$textPrimary${suffix}`,
    colorPress: `$textPrimary${suffix}`,
    colorFocus: `$textPrimary${suffix}`,
    borderColor: `$borderMuted${suffix}`,
    borderColorHover: `$borderStrong${suffix}`,
    borderColorFocus: `$borderStrong${suffix}`,
    borderColorPress: `$brandPrimary${suffix}`,
    placeholderColor: `$textMuted${suffix}`,
    outlineColor: `$brandPrimary${suffix}`,
    primary: `$brandPrimary${suffix}`,
    primaryPressed: `$brandPrimaryPressed${suffix}`,
    actionPrimaryForeground: `$brandPrimaryForeground${suffix}`,
    secondary: `$brandSecondary${suffix}`,
    secondaryPressed: `$brandSecondaryPressed${suffix}`,
    accentColor: `$brandPrimary${suffix}`,
    surfaceCard: `$surfaceCard${suffix}`,
    surfaceRaised: `$surfaceRaised${suffix}`,
    muted: `$textMuted${suffix}`,
    success: `$success${suffix}`,
    danger: `$danger${suffix}`,
    dangerStrong: `$dangerStrong${suffix}`,
    warning: `$warning${suffix}`,
    info: `$info${suffix}`,
  } as const;
};

const auraxisLightTheme = buildModeTheme("light");
const auraxisDarkTheme = buildModeTheme("dark");

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
  },
  defaultTheme: auraxisDefaultTheme,
  settings: {
    shouldAddPrefersColorThemes: false,
    allowedStyleValues: "somewhat-strict-web",
  },
});

export type AppTamaguiConfig = typeof tamaguiConfig;
