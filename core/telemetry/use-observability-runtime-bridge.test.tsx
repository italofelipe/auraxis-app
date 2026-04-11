import { act, renderHook, waitFor } from "@testing-library/react-native";

import { syncSentryOperationalContext } from "@/app/services/sentry";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useSessionStore } from "@/core/session/session-store";
import { useObservabilityRuntimeBridge } from "@/core/telemetry/use-observability-runtime-bridge";
import {
  makeSessionState,
  makeSessionUser,
  resetRuntimeStores,
} from "@/shared/testing/runtime-fixtures";

jest.mock("@/app/services/sentry", () => ({
  syncSentryOperationalContext: jest.fn(),
}));

describe("useObservabilityRuntimeBridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRuntimeStores({
      session: makeSessionState({
        hydrated: false,
        isAuthenticated: false,
      }),
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
        user: makeSessionUser(),
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
