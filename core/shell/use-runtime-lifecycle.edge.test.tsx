import type { PropsWithChildren, ReactElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import * as Linking from "expo-linking";
import { AppState, type AppStateStatus } from "react-native";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { reachabilityService } from "@/core/shell/reachability-service";
import { useRuntimeLifecycle } from "@/core/shell/use-runtime-lifecycle";
import { useSessionStore } from "@/core/session/session-store";

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

const createWrapper = (): ((
  props: PropsWithChildren,
) => ReactElement) => {
  const queryClient = new QueryClient();

  const TestHookWrapper = ({
    children,
  }: PropsWithChildren): ReactElement => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  TestHookWrapper.displayName = "TestHookWrapper";
  return TestHookWrapper;
};

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

describe("useRuntimeLifecycle - edge cases", () => {
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

  it("ignora links invalidos e nao duplica o processamento do mesmo retorno", async () => {
    const urlListenerRef: {
      current: ((event: { readonly url: string }) => void) | null;
    } = {
      current: null,
    };

    jest.mocked(Linking.getInitialURL).mockResolvedValue("auraxisapp://desconhecido");
    jest.mocked(Linking.addEventListener).mockImplementation(
      ((event, listener) => {
        if (event === "url") {
          urlListenerRef.current = listener as unknown as (
            event: { readonly url: string },
          ) => void;
        }

        return createLinkingSubscription();
      }) as typeof Linking.addEventListener,
    );

    renderHook(() => useRuntimeLifecycle(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(useAppShellStore.getState().lastHandledUrl).toBeNull();
    });

    urlListenerRef.current?.({
      url: "auraxisapp://assinatura?status=success&provider=asaas",
    });
    urlListenerRef.current?.({
      url: "auraxisapp://assinatura?status=success&provider=asaas",
    });

    await waitFor(() => {
      expect(mockRevalidate).toHaveBeenCalledWith("checkout-return");
    });

    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it("nao sincroniza quando o app muda para inactive sem voltar ao foreground", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue(null);
    jest.mocked(Linking.addEventListener).mockImplementation(
      ((..._args) => createLinkingSubscription()) as typeof Linking.addEventListener,
    );

    renderHook(() => useRuntimeLifecycle(), {
      wrapper: createWrapper(),
    });

    appStateListener?.("inactive");

    await waitFor(() => {
      expect(useAppShellStore.getState().appState).toBe("inactive");
    });

    expect(mockRevalidate).not.toHaveBeenCalledWith("foreground");
  });

  it("nao revalida no foreground quando o probe detecta offline", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue(null);
    jest.mocked(Linking.addEventListener).mockImplementation(
      ((..._args) => createLinkingSubscription()) as typeof Linking.addEventListener,
    );
    jest.mocked(reachabilityService.probe)
      .mockResolvedValueOnce({
        status: "online",
        degradedReason: null,
        checkedAt: "2026-04-08T15:00:00.000Z",
        latencyMs: 42,
        statusCode: 200,
      })
      .mockResolvedValueOnce({
        status: "offline",
        degradedReason: "offline",
        checkedAt: "2026-04-08T15:05:00.000Z",
        latencyMs: 130,
        statusCode: null,
      });

    renderHook(() => useRuntimeLifecycle(), {
      wrapper: createWrapper(),
    });

    appStateListener?.("active");

    await waitFor(() => {
      expect(useAppShellStore.getState()).toMatchObject({
        appState: "active",
        connectivityStatus: "offline",
        runtimeDegradedReason: "offline",
        lastReachabilityCheckAt: "2026-04-08T15:05:00.000Z",
      });
    });

    expect(mockRevalidate).not.toHaveBeenCalledWith("foreground");
  });

  it("marca degraded state quando a revalidation de foreground falha", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue(null);
    jest.mocked(Linking.addEventListener).mockImplementation(
      ((..._args) => createLinkingSubscription()) as typeof Linking.addEventListener,
    );
    mockRevalidate.mockRejectedValueOnce(new Error("foreground failed"));

    renderHook(() => useRuntimeLifecycle(), {
      wrapper: createWrapper(),
    });

    appStateListener?.("active");

    await waitFor(() => {
      expect(useAppShellStore.getState()).toMatchObject({
        connectivityStatus: "online",
        runtimeDegradedReason: "runtime-revalidation-failed",
      });
    });

    expect(mockRevalidate).toHaveBeenCalledWith("foreground");
  });
});
