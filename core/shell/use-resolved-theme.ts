import { useColorScheme } from "react-native";

import { useAppShellStore } from "@/core/shell/app-shell-store";

export type ResolvedThemeName = "auraxis_dark" | "auraxis_light";

/**
 * Resolves the active Tamagui theme name by combining the user's
 * `themePreference` with the device colour scheme.
 *
 * - `system` → mirrors `useColorScheme()` (defaults to dark when the
 *   OS reports `null`, preserving historical visuals).
 * - `light` / `dark` → pinned regardless of the OS setting.
 *
 * @returns Either `auraxis_dark` or `auraxis_light` — never `system`.
 */
export const useResolvedTheme = (): ResolvedThemeName => {
  const preference = useAppShellStore((state) => state.themePreference);
  const systemScheme = useColorScheme();

  if (preference === "light") {
    return "auraxis_light";
  }
  if (preference === "dark") {
    return "auraxis_dark";
  }

  return systemScheme === "light" ? "auraxis_light" : "auraxis_dark";
};
