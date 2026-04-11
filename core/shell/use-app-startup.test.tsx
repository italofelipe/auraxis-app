import { renderHook, waitFor } from "@testing-library/react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { initSentry } from "@/app/services/sentry";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useSessionStore } from "@/core/session/session-store";
import { appLogger } from "@/core/telemetry/app-logger";
import {
  resetAppStartupRuntimeForTests,
  useAppStartup,
} from "@/core/shell/use-app-startup";
import {
  makeSessionState,
  resetRuntimeStores,
} from "@/shared/testing/runtime-fixtures";

jest.mock("expo-font", () => ({
  useFonts: jest.fn(),
}));

jest.mock("@/app/services/sentry", () => ({
  initSentry: jest.fn(),
}));

jest.mock("@/core/telemetry/app-logger", () => ({
  appLogger: {
    info: jest.fn(),
  },
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

describe("useAppStartup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAppStartupRuntimeForTests();
    resetRuntimeStores({
      session: makeSessionState({
        hydrated: true,
        isAuthenticated: false,
      }),
    });
  });

  it("marca a app como pronta e inicializa o sentry no startup", async () => {
    (useFonts as jest.Mock).mockReturnValue([true]);
    const bootstrapSession = jest.fn().mockResolvedValue(undefined);
    useSessionStore.setState({
      hydrated: true,
      bootstrapSession,
    });

    const { result } = renderHook(() => useAppStartup());

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
      expect(useAppShellStore.getState().fontsReady).toBe(true);
      expect(useAppShellStore.getState().startupReady).toBe(true);
      expect(initSentry).toHaveBeenCalled();
      expect(appLogger.info).toHaveBeenCalledWith({
        domain: "startup",
        event: "startup.ready",
        context: {
          fontsLoaded: true,
          hydrated: true,
        },
      });
      expect(bootstrapSession).toHaveBeenCalledTimes(1);
      expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });
  });

  it("mantem o startup pendente enquanto a sessao ainda nao hidratou", async () => {
    (useFonts as jest.Mock).mockReturnValue([true]);
    useSessionStore.setState({
      hydrated: false,
      bootstrapSession: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => useAppStartup());

    await waitFor(() => {
      expect(useAppShellStore.getState().fontsReady).toBe(true);
      expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
    });

    expect(result.current.ready).toBe(false);
    expect(useAppShellStore.getState().startupReady).toBe(false);
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });
});
