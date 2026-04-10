import { act, renderHook, waitFor } from "@testing-library/react-native";

import { syncSentryOperationalContext } from "@/app/services/sentry";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useSessionStore } from "@/core/session/session-store";
import { useObservabilityRuntimeBridge } from "@/core/telemetry/use-observability-runtime-bridge";

jest.mock("@/app/services/sentry", () => ({
  syncSentryOperationalContext: jest.fn(),
}));

describe("useObservabilityRuntimeBridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppShellStore.setState({
      fontsReady: false,
      reducedMotionEnabled: false,
      startupReady: false,
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
      accessToken: null,
      refreshToken: null,
      user: null,
      userEmail: null,
      authenticatedAt: null,
      expiresAt: null,
      authFailureReason: null,
      lastValidatedAt: null,
      lastInvalidatedAt: null,
      hydrated: false,
      isAuthenticated: false,
      bootstrapSession: jest.fn().mockResolvedValue(undefined),
      signIn: jest.fn().mockResolvedValue(undefined),
      setSession: jest.fn().mockResolvedValue(undefined),
      updateUser: jest.fn(),
      markSessionValidated: jest.fn(),
      dismissAuthFailure: jest.fn(),
      invalidateSession: jest.fn().mockResolvedValue(undefined),
      signOut: jest.fn().mockResolvedValue(undefined),
    });
  });

  it("sincroniza o contexto operacional no mount e quando runtime/session mudam", async () => {
    renderHook(() => useObservabilityRuntimeBridge());

    await waitFor(() => {
      expect(syncSentryOperationalContext).toHaveBeenCalledTimes(1);
    });

    act(() => {
      useAppShellStore.setState((state) => ({
        ...state,
        connectivityStatus: "offline",
        runtimeDegradedReason: "offline",
      }));
      useSessionStore.setState((state) => ({
        ...state,
        hydrated: true,
        isAuthenticated: true,
        accessToken: "token",
        refreshToken: "refresh",
        user: {
          id: "user-1",
          name: "Italo",
          email: "italo@auraxis.dev",
          emailConfirmed: true,
        },
      }));
    });

    await waitFor(() => {
      expect(syncSentryOperationalContext).toHaveBeenCalledTimes(2);
    });

    expect(jest.mocked(syncSentryOperationalContext).mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        runtime: expect.objectContaining({
          connectivityStatus: "offline",
          runtimeDegradedReason: "offline",
        }),
        session: expect.objectContaining({
          hydrated: true,
          authenticated: true,
          hasRefreshToken: true,
        }),
      }),
    );
  });
});
