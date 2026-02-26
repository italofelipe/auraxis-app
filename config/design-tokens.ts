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
