import { colorPalette, fontSizes, radii, spacing } from "@/config/design-tokens";

/**
 * Dark variant of the canonical Auraxis palette. Background is
 * almost-black neutral, surfaces lift via slightly lighter neutrals,
 * brand stays warm orange.
 */
export const darkSemanticColors = {
  background: colorPalette.neutral950,
  surface: colorPalette.neutral900,
  surfaceRaised: colorPalette.neutral700,
  foreground: colorPalette.white,
  mutedForeground: colorPalette.brand300,
  subduedForeground: "#bcb3b3",
  primary: colorPalette.brand600,
  secondary: colorPalette.brand500,
  border: colorPalette.neutral700,
  success: "#4ade80",
  danger: colorPalette.danger500,
  dangerStrong: colorPalette.danger700,
} as const;

/**
 * Light variant of the canonical Auraxis palette. Background is
 * paper white, surfaces lift via cool greys, brand stays warm orange
 * but tones down on saturation for WCAG contrast against light fills.
 */
export const lightSemanticColors = {
  background: "#ffffff",
  surface: "#f7f7f8",
  surfaceRaised: "#eef0f3",
  foreground: "#1a1a1a",
  mutedForeground: "#5a5a5a",
  subduedForeground: "#8a8a8a",
  primary: colorPalette.brand600,
  secondary: colorPalette.brand500,
  border: "#dcdfe5",
  success: "#1f9d55",
  danger: "#c53030",
  dangerStrong: "#9b2424",
} as const;

/**
 * Default export — kept as `semanticColors` for backwards compatibility
 * with consumers that read static colours outside the Tamagui theme
 * resolver. Points to the dark variant to preserve historical visuals.
 */
export const semanticColors = darkSemanticColors;

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
  sm: radii.sm,
  md: radii.md,
  lg: 16,
  xl: 20,
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
