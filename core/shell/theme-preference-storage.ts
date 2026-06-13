import * as SecureStore from "expo-secure-store";

import {
  appShellStateDefaults,
  type ThemePreference,
} from "@/core/shell/app-shell-store";

/** Chave canônica da preferência de tema no SecureStore. */
export const THEME_PREFERENCE_STORAGE_KEY = "auraxis.theme-preference";

const THEME_PREFERENCE_VALUES: readonly ThemePreference[] = [
  "system",
  "light",
  "dark",
];

const isThemePreference = (
  value: string | null,
): value is ThemePreference => {
  return (
    value !== null &&
    (THEME_PREFERENCE_VALUES as readonly string[]).includes(value)
  );
};

/**
 * Lê a preferência de tema persistida. Cai no default (`light`, paridade web)
 * quando ausente, inválida ou se o SecureStore estiver indisponível — nunca
 * lança, para não travar o boot.
 *
 * @returns Preferência de tema resolvida.
 */
export const loadPersistedThemePreference =
  async (): Promise<ThemePreference> => {
    try {
      const stored = await SecureStore.getItemAsync(
        THEME_PREFERENCE_STORAGE_KEY,
      );
      if (isThemePreference(stored)) {
        return stored;
      }
    } catch {
      return appShellStateDefaults.themePreference;
    }
    return appShellStateDefaults.themePreference;
  };

/**
 * Persiste a preferência de tema escolhida. Best-effort: se o storage falhar,
 * a escolha simplesmente não sobrevive ao reinício (sem erro propagado).
 *
 * @param preference Preferência a persistir.
 */
export const persistThemePreference = async (
  preference: ThemePreference,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(THEME_PREFERENCE_STORAGE_KEY, preference);
  } catch {
    // Storage indisponível — a preferência não persiste neste turno.
  }
};
