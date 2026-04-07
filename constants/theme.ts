import { Platform } from "react-native";

import { colorPalette, typography } from "@/config/design-tokens";

export const Colors = {
  light: {
    text: colorPalette.white,
    background: colorPalette.neutral950,
    tint: colorPalette.brand600,
    icon: colorPalette.brand300,
    tabIconDefault: colorPalette.neutral700,
    tabIconSelected: colorPalette.brand600,
  },
  dark: {
    text: colorPalette.white,
    background: colorPalette.neutral950,
    tint: colorPalette.brand600,
    icon: colorPalette.brand300,
    tabIconDefault: colorPalette.neutral700,
    tabIconSelected: colorPalette.brand600,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: typography.body,
    serif: typography.heading,
    rounded: typography.bodyMedium,
    mono: "ui-monospace",
  },
  default: {
    sans: typography.body,
    serif: typography.heading,
    rounded: typography.bodyMedium,
    mono: "monospace",
  },
  web: {
    sans: typography.body,
    serif: typography.heading,
    rounded: typography.bodyMedium,
    mono: "monospace",
  },
});
