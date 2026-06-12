export const colorPalette = {
  neutral950: "#05070d",
  neutral900: "#0a0f1a",
  neutral850: "#0e1523",
  neutral800: "#121a2a",
  neutral750: "#172338",
  neutral700: "#1d2b44",
  neutral650: "#243652",
  neutral600: "#2d4466",
  text100: "#f1f5ff",
  text200: "#d2dcf3",
  text300: "#94a3bf",
  text400: "#6e7f9f",
  cyan300: "#9be9ff",
  cyan400: "#6fe0ff",
  cyan500: "#44d4ff",
  cyan600: "#24beea",
  cyan700: "#1598be",
  violet300: "#bfb5ff",
  violet400: "#a495ff",
  violet500: "#8b7dff",
  violet600: "#6f62e2",
  violet700: "#594fc2",
  lime300: "#86f7cc",
  lime400: "#63f0b9",
  lime500: "#42e8a9",
  lime600: "#22c88a",
  lime700: "#169b6b",
  orange300: "#ffd7a7",
  orange400: "#ffc985",
  orange500: "#ffb861",
  orange600: "#e89e47",
  orange700: "#c68431",
  red300: "#ffb0b6",
  red400: "#ff9099",
  red500: "#ff6f79",
  red600: "#e85763",
  red700: "#c53f4a",
  brand300: "#9be9ff",
  brand500: "#44d4ff",
  brand600: "#24beea",
  white: "#ffffff",
  danger500: "#ff6f79",
  danger700: "#c53f4a",
} as const;

// Paridade com o web (auraxis-web/app/theme/tokens/typography.ts):
// Inter para texto/headings e IBM Plex Mono para valores financeiros.
export const typography = {
  heading: "Inter_700Bold",
  headingSemiBold: "Inter_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  mono: "IBMPlexMono_500Medium",
  monoRegular: "IBMPlexMono_400Regular",
} as const;

export const spacing = (step: number): number => {
  return step * 8;
};

export const fontSizes = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

export const borderWidths = {
  hairline: 1,
} as const;

export const motionDurations = {
  instant: 0,
  fast: 120,
  normal: 180,
  slow: 260,
} as const;

export const motionScales = {
  pressIn: 0.98,
  pressOut: 1,
} as const;
