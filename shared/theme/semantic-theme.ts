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
  primarySubtle: "rgba(68,212,255,0.12)",
  secondary: colorPalette.violet500,
  secondaryPressed: colorPalette.violet600,
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(68,212,255,0.40)",
  success: colorPalette.lime500,
  successSubtle: "rgba(66,232,169,0.16)",
  danger: colorPalette.red500,
  dangerStrong: colorPalette.red700,
  dangerSubtle: "rgba(255,111,121,0.16)",
  warning: colorPalette.orange500,
  warningSubtle: "rgba(255,184,97,0.16)",
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
  primarySubtle: "#D8F3FB",
  secondary: "#6F62E2",
  secondaryPressed: "#594FC2",
  border: "#D8E3EF",
  borderStrong: "#087FA7",
  success: "#087F5B",
  successSubtle: "#DCF2EA",
  danger: "#C2414D",
  dangerStrong: "#A33440",
  dangerSubtle: "#FBE4E6",
  warning: "#B7791F",
  warningSubtle: "#FBEFD9",
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
  "4xl": spacing(8),
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
  // Sombra de superfície dos cards — paridade com o web
  // (`0 10px 24px rgba(0,0,0,0.15)`); mais larga e suave que `md`.
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  // Card destacado / interativo em hover-press.
  raised: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  // Sheets e overlays que sobem de baixo (sombra para cima).
  overlay: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

export type SemanticShadowKey = keyof typeof semanticShadows;

// ---------------------------------------------------------------------------
// Glow (sombra colorida) — profundidade de marca SEM módulo nativo
// ---------------------------------------------------------------------------

/**
 * Glows usam `shadowColor` colorido (o RN aceita qualquer cor) para aproximar
 * o brilho de marca do web (`0 18px 44px rgba(68,212,255,0.24)`) — 100%
 * OTA-able, sem `expo-blur`/gradiente nativo. São dependentes de tema (a cor =
 * primária do tema), então há uma variante light e uma dark; o call-site
 * resolve via `useResolvedTheme()` e faz spread: `{ ...glows.brand }`.
 */
const buildGlows = (
  tone: { brand: string; success: string; danger: string },
  opacity: { strong: number; soft: number },
) =>
  ({
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    brand: {
      shadowColor: tone.brand,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: opacity.strong,
      shadowRadius: 22,
      elevation: 10,
    },
    brandSoft: {
      shadowColor: tone.brand,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: opacity.soft,
      shadowRadius: 14,
      elevation: 6,
    },
    success: {
      shadowColor: tone.success,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: opacity.strong,
      shadowRadius: 18,
      elevation: 8,
    },
    danger: {
      shadowColor: tone.danger,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: opacity.strong,
      shadowRadius: 18,
      elevation: 8,
    },
  }) as const;

export const lightSemanticGlows = buildGlows(
  {
    brand: lightSemanticColors.primary,
    success: lightSemanticColors.success,
    danger: lightSemanticColors.danger,
  },
  { strong: 0.28, soft: 0.18 },
);

export const darkSemanticGlows = buildGlows(
  {
    brand: darkSemanticColors.primary,
    success: darkSemanticColors.success,
    danger: darkSemanticColors.danger,
  },
  { strong: 0.45, soft: 0.3 },
);

export type SemanticGlowKey = keyof typeof lightSemanticGlows;

// ---------------------------------------------------------------------------
// Gradientes (gradient-ready) — definidos agora, renderizados no v1.8.0
// ---------------------------------------------------------------------------

/**
 * Stops de gradiente por tema, no formato consumido por `expo-linear-gradient`
 * (`colors` + `start`/`end`). Definidos já no Milestone A para que o
 * `<AppGradient>` do v1.8.0 leia o MESMO token sem renomear — no OTA atual os
 * CTAs usam a cor sólida `$primary` + glow; no build nativo passam a gradiente.
 * Light: teal→verde (`#087FA7`→`#087F5B`). Dark: cyan→lime (Market Pulse).
 */
export const lightSemanticGradients = {
  primary: {
    colors: ["#087FA7", "#087F5B"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  secondary: {
    colors: ["#087FA7", "#6F62E2"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Hero da área de Cartões (handoff): teal escuro descendo para quase-preto.
  hero: {
    colors: ["#0F5E6F", "#0A2F38"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export const darkSemanticGradients = {
  primary: {
    colors: [colorPalette.cyan500, colorPalette.lime500] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  secondary: {
    colors: [colorPalette.cyan500, colorPalette.violet500] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Hero da área de Cartões (handoff dark): teal profundo para quase-preto.
  hero: {
    colors: ["#0D4A58", "#071F25"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export type SemanticGradientKey = keyof typeof lightSemanticGradients;

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
