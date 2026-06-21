import type { ComponentProps, ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { XStack, useTheme } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { iconSizes } from "@/shared/theme";

export interface ThemeModeToggleProps {
  readonly isDark: boolean;
  readonly onToggle: () => void;
  readonly testID?: string;
}

type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const MOON_ICON: MaterialCommunityIconName = "weather-night";
const SUN_ICON: MaterialCommunityIconName = "white-balance-sunny";

/**
 * Round icon button that flips the app between light and dark. Shows a sun
 * while dark (tap to lighten) and a moon while light (tap to darken),
 * mirroring the masthead control in the design handoff.
 *
 * @param props Current dark flag and the toggle handler.
 * @returns A theme-mode icon button.
 */
export function ThemeModeToggle({
  isDark,
  onToggle,
  testID,
}: ThemeModeToggleProps): ReactElement {
  const theme = useTheme();
  const iconColor = theme.muted?.val ?? theme.color?.val ?? "#000000";

  return (
    <XStack
      alignItems="center"
      justifyContent="center"
      width={iconSizes.xl}
      height={iconSizes.xl}
      borderRadius="$5"
      borderWidth={borderWidths.hairline}
      borderColor="$borderColor"
      backgroundColor="$surfaceRaised"
      accessibilityRole="button"
      accessibilityState={{ selected: isDark }}
      accessibilityLabel={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      testID={testID ?? "insights-theme-mode-toggle"}
      pressStyle={{ opacity: 0.85 }}
      onPress={() => {
        triggerHapticImpact("light");
        onToggle();
      }}
    >
      <MaterialCommunityIcons
        name={isDark ? SUN_ICON : MOON_ICON}
        size={iconSizes.md}
        color={iconColor}
      />
    </XStack>
  );
}
