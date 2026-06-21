import type { ReactElement, ReactNode } from "react";

import { BlurView, type BlurTint } from "expo-blur";
import type { StyleProp, ViewStyle } from "react-native";

import { useResolvedTheme } from "@/core/shell/use-resolved-theme";

export interface BlurSurfaceProps {
  /** Blur strength (1–100). Defaults to the platform-native 50. */
  readonly intensity?: number;
  /**
   * Material tint. When omitted, follows the resolved app theme
   * (`dark` in dark mode, `light` otherwise).
   */
  readonly tint?: Extract<BlurTint, "light" | "dark" | "default">;
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: ReactNode;
  readonly testID?: string;
}

/**
 * Translucent material surface backed by `expo-blur`. Used for the floating tab
 * bar and other chrome that should read the content behind it. The tint
 * defaults to the active theme so the bar stays legible in light and dark.
 *
 * @param props Optional `intensity`, `tint` override, `style` and children.
 * @returns A `BlurView` themed for the current colour scheme.
 */
export function BlurSurface({
  intensity = 50,
  tint,
  style,
  children,
  testID,
}: BlurSurfaceProps): ReactElement {
  const resolvedTheme = useResolvedTheme();
  const resolvedTint: BlurTint =
    tint ?? (resolvedTheme === "auraxis_dark" ? "dark" : "light");

  return (
    <BlurView
      intensity={intensity}
      tint={resolvedTint}
      style={style}
      testID={testID}
    >
      {children}
    </BlurView>
  );
}
