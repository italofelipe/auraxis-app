import { useEffect, useRef, useState } from "react";

import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from "@expo-google-fonts/ibm-plex-mono";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { initSentry } from "@/app/services/sentry";
import { initPostHog } from "@/core/observability/posthog-service";
import {
  performanceTracker,
  resetPerformanceTrackerForTests,
} from "@/core/performance/performance-tracker";
import { runDeviceIntegrityCheck } from "@/core/security/integrity-check";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { loadPersistedThemePreference } from "@/core/shell/theme-preference-storage";
import { useSessionStore } from "@/core/session/session-store";
import { startupLogger } from "@/core/telemetry/domain-loggers";
import { initI18n } from "@/shared/i18n";

let sentryInitialized = false;
let postHogInitialized = false;
let splashScreenPrevented = false;
let i18nInitialized = false;
let integrityCheckDispatched = false;

const ensureI18nInitialized = (initialLocale?: "pt" | "en"): void => {
  if (i18nInitialized) {
    return;
  }
  i18nInitialized = true;
  void initI18n(initialLocale);
};

const ensureIntegrityCheckDispatched = (): void => {
  if (integrityCheckDispatched) {
    return;
  }
  integrityCheckDispatched = true;
  // Fire-and-forget. Best-effort; never blocks the boot path.
  void runDeviceIntegrityCheck();
};

const ensureSentryInitialized = (): void => {
  if (sentryInitialized) {
    return;
  }

  initSentry();
  sentryInitialized = true;
};

const ensurePostHogInitialized = (): void => {
  if (postHogInitialized) {
    return;
  }

  postHogInitialized = true;
  void initPostHog();
};

const ensureSplashScreenPrevented = (): void => {
  if (splashScreenPrevented) {
    return;
  }

  splashScreenPrevented = true;
  void SplashScreen.preventAutoHideAsync();
};

export const resetAppStartupRuntimeForTests = (): void => {
  sentryInitialized = false;
  postHogInitialized = false;
  splashScreenPrevented = false;
  i18nInitialized = false;
  integrityCheckDispatched = false;
  resetPerformanceTrackerForTests();
};

export interface AppStartupState {
  readonly ready: boolean;
}

export const useAppStartup = (): AppStartupState => {
  const setFontsReady = useAppShellStore((state) => state.setFontsReady);
  const setStartupReady = useAppShellStore((state) => state.setStartupReady);
  const bootstrapSession = useSessionStore((state) => state.bootstrapSession);
  const hydrated = useSessionStore((state) => state.hydrated);
  const setThemePreference = useAppShellStore(
    (state) => state.setThemePreference,
  );
  const [themeHydrated, setThemeHydrated] = useState(false);
  const startupMeasurementStarted = useRef(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
  });

  useEffect(() => {
    ensureSentryInitialized();
    ensurePostHogInitialized();
    ensureSplashScreenPrevented();
    ensureI18nInitialized(useAppShellStore.getState().locale);
    ensureIntegrityCheckDispatched();
    if (!startupMeasurementStarted.current) {
      performanceTracker.start("startup.total");
      startupMeasurementStarted.current = true;
    }
    startupLogger.log("startup.bootstrap_requested", {
      context: {
        hydrated: useSessionStore.getState().hydrated,
      },
    });
    void bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    setFontsReady(fontsLoaded);
  }, [fontsLoaded, setFontsReady]);

  // Hidrata a preferência de tema persistida ANTES de `ready` para evitar um
  // flash de tema (claro → escuro) no cold start de quem escolheu dark.
  useEffect(() => {
    let active = true;
    void loadPersistedThemePreference().then((preference) => {
      if (!active) {
        return;
      }
      setThemePreference(preference);
      setThemeHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [setThemePreference]);

  const ready = fontsLoaded && hydrated && themeHydrated;

  useEffect(() => {
    setStartupReady(ready);

    if (!ready) {
      return;
    }

    startupLogger.log("startup.ready", {
      context: {
        fontsLoaded,
        hydrated,
      },
    });
    performanceTracker.end("startup.total", {
      fontsLoaded,
      hydrated,
    });
    void SplashScreen.hideAsync();
  }, [fontsLoaded, hydrated, ready, setStartupReady]);

  return {
    ready,
  };
};
