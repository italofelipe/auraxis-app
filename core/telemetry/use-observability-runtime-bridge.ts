import { useEffect } from "react";

import {
  buildSentryOperationalContext,
} from "@/core/telemetry/operational-context";
import { syncSentryOperationalContext } from "@/app/services/sentry";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useSessionStore } from "@/core/session/session-store";

export const useObservabilityRuntimeBridge = (): void => {
  const appState = useAppShellStore((state) => state.appState);
  const connectivityStatus = useAppShellStore((state) => state.connectivityStatus);
  const runtimeDegradedReason = useAppShellStore(
    (state) => state.runtimeDegradedReason,
  );
  const startupReady = useAppShellStore((state) => state.startupReady);
  const fontsReady = useAppShellStore((state) => state.fontsReady);
  const reducedMotionEnabled = useAppShellStore(
    (state) => state.reducedMotionEnabled,
  );
  const entitlementsVersion = useAppShellStore((state) => state.entitlementsVersion);
  const pendingCheckoutReturn = useAppShellStore(
    (state) => state.pendingCheckoutReturn,
  );
  const lastForegroundSyncAt = useAppShellStore(
    (state) => state.lastForegroundSyncAt,
  );
  const lastReachabilityCheckAt = useAppShellStore(
    (state) => state.lastReachabilityCheckAt,
  );
  const hydrated = useSessionStore((state) => state.hydrated);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const authFailureReason = useSessionStore((state) => state.authFailureReason);
  const refreshToken = useSessionStore((state) => state.refreshToken);
  const authenticatedAt = useSessionStore((state) => state.authenticatedAt);
  const expiresAt = useSessionStore((state) => state.expiresAt);
  const lastValidatedAt = useSessionStore((state) => state.lastValidatedAt);
  const lastInvalidatedAt = useSessionStore((state) => state.lastInvalidatedAt);
  const userId = useSessionStore((state) => state.user?.id ?? null);
  const emailConfirmed = useSessionStore(
    (state) => state.user?.emailConfirmed ?? null,
  );

  useEffect(() => {
    syncSentryOperationalContext(buildSentryOperationalContext());
  }, [
    appState,
    authenticatedAt,
    authFailureReason,
    connectivityStatus,
    emailConfirmed,
    entitlementsVersion,
    expiresAt,
    fontsReady,
    hydrated,
    isAuthenticated,
    lastForegroundSyncAt,
    lastInvalidatedAt,
    lastReachabilityCheckAt,
    lastValidatedAt,
    pendingCheckoutReturn,
    reducedMotionEnabled,
    refreshToken,
    runtimeDegradedReason,
    startupReady,
    userId,
  ]);
};
