import { colorPalette, fontSizes, radii, spacing } from "@/config/design-tokens";

export const semanticColors = {
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
} as const;

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
