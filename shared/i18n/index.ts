import { getLocales } from "expo-localization";
import { changeLanguage, default as i18n, use as i18nUse } from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

import type { AppLocale } from "@/core/shell/app-shell-store";

import enResources from "./locales/en.json";
import ptResources from "./locales/pt.json";

const SUPPORTED_LOCALES: readonly AppLocale[] = ["pt", "en"] as const;
const DEFAULT_LOCALE: AppLocale = "pt";

const resources = {
  pt: { translation: ptResources },
  en: { translation: enResources },
} as const;

/**
 * Detects the device's preferred locale and clamps it to the locales
 * shipped in the app. Anything outside `pt`/`en` falls back to PT.
 *
 * @returns Two-letter app locale.
 */
export const detectDeviceLocale = (): AppLocale => {
  const devices = getLocales();
  for (const device of devices) {
    const code = device.languageCode?.toLowerCase();
    if (code && SUPPORTED_LOCALES.includes(code as AppLocale)) {
      return code as AppLocale;
    }
  }
  return DEFAULT_LOCALE;
};

let initialised = false;

/**
 * Initialises i18next exactly once. Safe to call from `useAppStartup`
 * or any provider — subsequent calls are no-ops.
 *
 * @param initialLocale Locale to start with. Defaults to device.
 */
export const initI18n = async (initialLocale?: AppLocale): Promise<void> => {
  if (initialised) {
    return;
  }
  initialised = true;
  await i18nUse(initReactI18next).init({
    resources,
    lng: initialLocale ?? detectDeviceLocale(),
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    returnNull: false,
  });
};

/**
 * Switches the active locale at runtime. Returns the resolved locale
 * (clamped to supported codes).
 *
 * @param next Requested locale.
 */
export const switchLocale = async (next: AppLocale): Promise<AppLocale> => {
  if (!SUPPORTED_LOCALES.includes(next)) {
    return DEFAULT_LOCALE;
  }
  await changeLanguage(next);
  return next;
};

/**
 * Canonical translation hook for the app. Re-exports `useTranslation`
 * so screens never have to import `react-i18next` directly.
 *
 * @returns The same shape as `useTranslation()` from react-i18next.
 */
export const useT = (): ReturnType<typeof useTranslation> => useTranslation();

export { i18n, SUPPORTED_LOCALES, DEFAULT_LOCALE };
