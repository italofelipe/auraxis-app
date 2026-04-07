import { useEffect } from "react";

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

import { initSentry } from "@/app/services/sentry";
import { useAppShellStore } from "@/core/shell/app-shell-store";

let sentryInitialized = false;

const ensureSentryInitialized = (): void => {
  if (sentryInitialized) {
    return;
  }

  initSentry();
  sentryInitialized = true;
};

export interface AppStartupState {
  readonly ready: boolean;
}

export const useAppStartup = (): AppStartupState => {
  const setFontsReady = useAppShellStore((state) => state.setFontsReady);
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
  });

  useEffect(() => {
    ensureSentryInitialized();
  }, []);

  useEffect(() => {
    setFontsReady(fontsLoaded);
  }, [fontsLoaded, setFontsReady]);

  return {
    ready: fontsLoaded,
  };
};
