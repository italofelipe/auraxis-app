import { useEffect, useRef } from "react";

import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
} from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { initSentry } from "@/app/services/sentry";
import {
  performanceTracker,
  resetPerformanceTrackerForTests,
} from "@/core/performance/performance-tracker";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useSessionStore } from "@/core/session/session-store";
import { startupLogger } from "@/core/telemetry/domain-loggers";

let sentryInitialized = false;
let splashScreenPrevented = false;

const ensureSentryInitialized = (): void => {
  if (sentryInitialized) {
    return;
  }

  initSentry();
  sentryInitialized = true;
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
  splashScreenPrevented = false;
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
  const startupMeasurementStarted = useRef(false);
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
  });

  useEffect(() => {
    ensureSentryInitialized();
    ensureSplashScreenPrevented();
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

  const ready = fontsLoaded && hydrated;

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
