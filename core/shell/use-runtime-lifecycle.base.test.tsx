import type { PropsWithChildren, ReactElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import * as Linking from "expo-linking";
import { AppState, type AppStateStatus } from "react-native";

import { useAppShellStore } from "@/core/shell/app-shell-store";
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
    entitlementsVersion: null,
    pendingCheckoutReturn: null,
    lastHandledUrl: null,
    lastForegroundSyncAt: null,
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
      wrapper: createWrapper(),
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
    expect(mockRevalidate).toHaveBeenCalledWith("checkout-return");
  });

  it("revalida dados quando o app volta do background", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue(null);
    jest.mocked(Linking.addEventListener).mockImplementation(
      ((..._args) => createLinkingSubscription()) as typeof Linking.addEventListener,
    );

    renderHook(() => useRuntimeLifecycle(), {
      wrapper: createWrapper(),
    });

    appStateListener?.("active");

    await waitFor(() => {
      expect(mockRevalidate).toHaveBeenCalledWith("foreground");
    });

    expect(useAppShellStore.getState().appState).toBe("active");
  });
});
