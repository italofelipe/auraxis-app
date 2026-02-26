import { MD3LightTheme, type MD3Theme } from "react-native-paper";

import { colorPalette, typography } from "@/config/design-tokens";

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: colorPalette.brand500,
    secondary: colorPalette.brand600,
    onPrimary: colorPalette.neutral950,
    background: colorPalette.white,
    surface: colorPalette.white,
    onSurface: colorPalette.neutral900,
    outline: colorPalette.neutral700,
    error: colorPalette.danger500,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: {
      ...MD3LightTheme.fonts.displayLarge,
      fontFamily: typography.heading,
    },
    displayMedium: {
      ...MD3LightTheme.fonts.displayMedium,
      fontFamily: typography.heading,
    },
    headlineLarge: {
      ...MD3LightTheme.fonts.headlineLarge,
      fontFamily: typography.headingSemiBold,
    },
    bodyLarge: {
      ...MD3LightTheme.fonts.bodyLarge,
      fontFamily: typography.body,
    },
    bodyMedium: {
      ...MD3LightTheme.fonts.bodyMedium,
      fontFamily: typography.bodyMedium,
    },
    titleMedium: {
      ...MD3LightTheme.fonts.titleMedium,
      fontFamily: typography.bodySemiBold,
    },
  },
};
