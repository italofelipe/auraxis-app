import { renderHook, waitFor } from "@testing-library/react-native";
import * as Linking from "expo-linking";
import { AppState, type AppStateStatus } from "react-native";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { reachabilityService } from "@/core/shell/reachability-service";
import { useRuntimeLifecycle } from "@/core/shell/use-runtime-lifecycle";
import { useSessionStore } from "@/core/session/session-store";
import { appLogger } from "@/core/telemetry/app-logger";
import { createTestHookWrapper } from "@/shared/testing/test-providers";

const mockRevalidate = jest.fn().mockResolvedValue({
  revalidated: true,
  signedOut: false,
  entitlementsVersion: 4,
});

jest.mock("expo-linking", () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
}));

jest.mock("@/core/shell/runtime-revalidation", () => ({
  createRuntimeRevalidationService: jest.fn(() => ({
    revalidate: mockRevalidate,
  })),
}));

jest.mock("@/core/shell/reachability-service", () => ({
  reachabilityService: {
    probe: jest.fn(),
  },
}));

jest.mock("@/core/telemetry/app-logger", () => ({
  appLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const createLinkingSubscription = (): ReturnType<
  typeof Linking.addEventListener
> => {
  return {
    remove: jest.fn(),
  } as unknown as ReturnType<typeof Linking.addEventListener>;
};

const resetStores = (): void => {
  useAppShellStore.setState({
    fontsReady: true,
    reducedMotionEnabled: false,
    startupReady: true,
    appState: "unknown",
    connectivityStatus: "unknown",
    runtimeDegradedReason: null,
    entitlementsVersion: null,
    pendingCheckoutReturn: null,
    lastHandledUrl: null,
    lastForegroundSyncAt: null,
    lastReachabilityCheckAt: null,
  });
  useSessionStore.setState({
    accessToken: "token",
    refreshToken: "refresh",
    user: {
      id: "user-1",
      name: "Italo",
      email: "italo@auraxis.dev",
      emailConfirmed: true,
    },
    userEmail: "italo@auraxis.dev",
    hydrated: true,
    isAuthenticated: true,
    bootstrapSession: jest.fn().mockResolvedValue(undefined),
    signIn: jest.fn().mockResolvedValue(undefined),
    setSession: jest.fn().mockResolvedValue(undefined),
    updateUser: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
  });
};

describe("useRuntimeLifecycle - core flow", () => {
  let appStateListener: ((state: AppStateStatus) => void) | null;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateListener = null;
    jest.mocked(reachabilityService.probe).mockResolvedValue({
      status: "online",
      degradedReason: null,
      checkedAt: "2026-04-08T15:00:00.000Z",
      latencyMs: 42,
      statusCode: 200,
    });
    Object.defineProperty(AppState, "currentState", {
      configurable: true,
      value: "background",
    });
    jest.spyOn(AppState, "addEventListener").mockImplementation(
      (_event, listener) => {
        appStateListener = listener;
        return {
          remove: jest.fn(),
        };
      },
    );
    resetStores();
  });

  it("faz probe de conectividade no startup sem disparar runtime revalidation", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue(null);
    jest.mocked(Linking.addEventListener).mockImplementation(
      ((..._args) => createLinkingSubscription()) as typeof Linking.addEventListener,
    );

    renderHook(() => useRuntimeLifecycle(), {
      wrapper: createTestHookWrapper(),
    });

    await waitFor(() => {
      expect(useAppShellStore.getState()).toMatchObject({
        connectivityStatus: "online",
        runtimeDegradedReason: null,
        lastReachabilityCheckAt: "2026-04-08T15:00:00.000Z",
      });
    });

    expect(reachabilityService.probe).toHaveBeenCalledTimes(1);
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it("processa o deep link inicial de retorno do checkout", async () => {
    const removeUrlListener = jest.fn();
    jest.mocked(Linking.getInitialURL).mockResolvedValue(
      "auraxisapp://assinatura?status=success&provider=asaas&token=checkout_secret",
    );
    jest.mocked(Linking.addEventListener).mockImplementation(
      ((..._args) => {
        const subscription = createLinkingSubscription();
        subscription.remove = removeUrlListener;
        return subscription;
      }) as typeof Linking.addEventListener,
    );

    renderHook(() => useRuntimeLifecycle(), {
      wrapper: createTestHookWrapper(),
    });

    await waitFor(() => {
      expect(useAppShellStore.getState().pendingCheckoutReturn).toMatchObject({
        status: "success",
        provider: "asaas",
        rawUrl:
          "auraxisapp://assinatura?status=success&provider=asaas&token=%3Credacted%3E",
      });
    });

    expect(useAppShellStore.getState().lastHandledUrl).toBe(
      "auraxisapp://assinatura?status=success&provider=asaas&token=%3Credacted%3E",
    );
    expect(useAppShellStore.getState().connectivityStatus).toBe("online");
    expect(mockRevalidate).toHaveBeenCalledWith("checkout-return");
    expect(appLogger.info).toHaveBeenCalledWith({
      domain: "checkout",
      event: "checkout.return_received",
      context: {
        href: "/assinatura",
        status: "success",
        provider: "asaas",
        planSlug: null,
        hasExternalReference: false,
        url: "auraxisapp://assinatura?status=success&provider=asaas&token=%3Credacted%3E",
      },
    });
  });

  it("revalida dados quando o app volta do background", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue(null);
    jest.mocked(Linking.addEventListener).mockImplementation(
      ((..._args) => createLinkingSubscription()) as typeof Linking.addEventListener,
    );

    renderHook(() => useRuntimeLifecycle(), {
      wrapper: createTestHookWrapper(),
    });

    appStateListener?.("active");

    await waitFor(() => {
      expect(mockRevalidate).toHaveBeenCalledWith("foreground");
    });

    expect(useAppShellStore.getState()).toMatchObject({
      appState: "active",
      connectivityStatus: "online",
      runtimeDegradedReason: null,
    });
    expect(appLogger.info).toHaveBeenCalledWith({
      domain: "runtime",
      event: "runtime.app_state_changed",
      context: {
        previousAppState: "background",
        nextAppState: "active",
        shouldSync: true,
      },
    });
  });
});
