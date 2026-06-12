import { colorPalette, fontSizes, radii, spacing } from "@/config/design-tokens";

/**
 * Dark variant of the canonical Auraxis DS v3 "Market Pulse" palette.
 * Backgrounds use the navy neutral scale and actions use cyan/violet
 * accents, matching the web source of truth.
 */
export const darkSemanticColors = {
  background: colorPalette.neutral950,
  surface: colorPalette.neutral800,
  surfaceRaised: colorPalette.neutral750,
  foreground: colorPalette.text100,
  mutedForeground: colorPalette.text300,
  subduedForeground: colorPalette.text400,
  primary: colorPalette.cyan500,
  primaryPressed: colorPalette.cyan600,
  primaryForeground: colorPalette.neutral900,
  secondary: colorPalette.violet500,
  secondaryPressed: colorPalette.violet600,
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(68,212,255,0.40)",
  success: colorPalette.lime500,
  danger: colorPalette.red500,
  dangerStrong: colorPalette.red700,
  warning: colorPalette.orange500,
  info: colorPalette.cyan500,
} as const;

/**
 * Light variant — DEFAULT do app, paridade exata com o tema light do web
 * (`auraxis-web/app/theme/tokens/semantic.ts`, palette `light`). Teal
 * #087FA7 como ação primária sobre superfícies brancas/azul-acinzentadas.
 */
export const lightSemanticColors = {
  background: "#F4F8FB",
  surface: colorPalette.white,
  surfaceRaised: "#F8FBFF",
  foreground: "#0A1628",
  mutedForeground: "#5D6F89",
  subduedForeground: "#7A8BA3",
  primary: "#087FA7",
  primaryPressed: "#066985",
  primaryForeground: colorPalette.white,
  secondary: "#6F62E2",
  secondaryPressed: "#594FC2",
  border: "#D8E3EF",
  borderStrong: "#087FA7",
  success: "#087F5B",
  danger: "#C2414D",
  dangerStrong: "#A33440",
  warning: "#B7791F",
  info: "#2563EB",
} as const;

/**
 * Default export — kept as `semanticColors` for backwards compatibility
 * with consumers that read static colours outside the Tamagui theme
 * resolver. Points to light because light is now the default app mode.
 */
export const semanticColors = lightSemanticColors;

export const semanticTypography = {
  display: fontSizes["4xl"],
  h1: fontSizes["3xl"],
  h2: fontSizes["2xl"],
  h3: fontSizes.xl,
  body: fontSizes.base,
  bodySm: fontSizes.sm,
  caption: fontSizes.xs,
} as const;

export const semanticSpacing = {
  xxs: spacing(0.5),
  xs: spacing(1),
  sm: spacing(1.5),
  md: spacing(2),
  lg: spacing(3),
  xl: spacing(4),
  "2xl": spacing(5),
  "3xl": spacing(6),
} as const;

export const semanticRadii = {
  xs: radii.xs,
  sm: radii.sm,
  md: radii.md,
  lg: radii.lg,
  xl: radii.xl,
  pill: 999,
} as const;

// ---------------------------------------------------------------------------
// Shadow / Elevation
// ---------------------------------------------------------------------------

/**
 * Canonical shadow definitions for React Native (`shadowColor`, `elevation`).
 * Use the object spread pattern: `{ ...semanticShadows.card }`.
 *
 * iOS uses shadow* props; Android uses `elevation`.
 * Both are included in each token so components can spread without
 * platform-specific branches.
 */
export const semanticShadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export type SemanticShadowKey = keyof typeof semanticShadows;

// ---------------------------------------------------------------------------
// Icon system
// ---------------------------------------------------------------------------

/**
 * Canonical icon sizes mapped to the 8px grid.
 * Matches the `size` scale in Tamagui tokens.
 */
export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSizeKey = keyof typeof iconSizes;

/**
 * Icon set used across the app: `@expo/vector-icons` — specifically
 * `MaterialCommunityIcons` as the canonical icon library.
 *
 * Usage pattern:
 * ```tsx
 * import { MaterialCommunityIcons } from "@expo/vector-icons";
 *
 * <MaterialCommunityIcons
 *   name="wallet-outline"
 *   size={iconSizes.md}
 *   color={semanticColors.primary}
 * />
 * ```
 *
 * Prefer outlined variants for navigation and filled for active state.
 */
export const iconLibrary = "MaterialCommunityIcons" as const;
