export const colorPalette = {
  neutral900: "#262121",
  brand500: "#ffbe4d",
  neutral700: "#413939",
  neutral950: "#0b0909",
  brand300: "#ffd180",
  brand600: "#ffab1a",
  white: "#ffffff",
  danger500: "#d64545",
} as const;

export const typography = {
  heading: "PlayfairDisplay_700Bold",
  headingSemiBold: "PlayfairDisplay_600SemiBold",
  body: "Raleway_400Regular",
  bodyMedium: "Raleway_500Medium",
  bodySemiBold: "Raleway_600SemiBold",
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
  sm: 8,
  md: 12,
} as const;

export const borderWidths = {
  hairline: 1,
} as const;
