import { useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  parseAppUrl,
  sanitizeAppUrl,
  type CheckoutReturnIntent,
} from "@/core/navigation/deep-linking";
import {
  type RuntimeAppState,
  useAppShellStore,
} from "@/core/shell/app-shell-store";
import { reachabilityService } from "@/core/shell/reachability-service";
import { createRuntimeRevalidationService } from "@/core/shell/runtime-revalidation";
import { resetRuntimeAfterSessionInvalidation } from "@/core/session/session-invalidation";
import { useSessionStore } from "@/core/session/session-store";
import {
  authLogger,
  checkoutLogger,
  navigationLogger,
  runtimeLogger,
} from "@/core/telemetry/domain-loggers";
import { bootstrapService } from "@/features/bootstrap/services/bootstrap-service";
import { subscriptionService } from "@/features/subscription/services/subscription-service";

const normalizeAppState = (value: AppStateStatus): RuntimeAppState => {
  if (
    value === "active" ||
    value === "inactive" ||
    value === "background"
  ) {
    return value;
  }

  return "unknown";
};

const shouldSyncOnForeground = (
  previous: AppStateStatus,
  next: AppStateStatus,
): boolean => {
  return (
    next === "active" &&
    (previous === "inactive" || previous === "background")
  );
};

type RuntimeSyncReason = "startup" | "foreground" | "checkout-return";

const resolveRuntimeFailureReason = (
  reason: Exclude<RuntimeSyncReason, "startup">,
) => {
  return reason === "checkout-return"
    ? "checkout-return-failed"
    : "runtime-revalidation-failed";
};

interface IncomingUrlHandlerDependencies {
  readonly setPendingCheckoutReturn: (value: CheckoutReturnIntent | null) => void;
  readonly setLastHandledUrl: (value: string | null) => void;
  readonly revalidate: (reason: "checkout-return") => Promise<unknown>;
}

const createIncomingUrlHandler = (
  dependencies: IncomingUrlHandlerDependencies,
) => {
  return async (rawUrl: string | null): Promise<void> => {
    if (!rawUrl) {
      return;
    }

    const sanitizedUrl = sanitizeAppUrl(rawUrl);

    if (useAppShellStore.getState().lastHandledUrl === sanitizedUrl) {
      navigationLogger.log("navigation.deep_link_deduplicated", {
        context: {
          url: sanitizedUrl,
        },
      });
      return;
    }

    const intent = parseAppUrl(rawUrl);
    if (!intent) {
      navigationLogger.log("navigation.deep_link_ignored", {
        context: {
          url: sanitizedUrl,
        },
      });
      return;
    }

    dependencies.setLastHandledUrl(sanitizedUrl);

    if (intent.kind !== "checkout-return") {
      navigationLogger.log("navigation.deep_link_handled", {
        context: {
          url: intent.rawUrl,
          href: intent.href,
        },
      });
      return;
    }

    checkoutLogger.log("checkout.return_received", {
      context: {
        href: intent.href,
        status: intent.status,
        provider: intent.provider,
        planSlug: intent.planSlug,
        hasExternalReference: intent.externalReference !== null,
        url: intent.rawUrl,
      },
    });
    dependencies.setPendingCheckoutReturn(intent);
    await dependencies.revalidate("checkout-return");
  };
};

const bindInitialUrlLifecycle = (
  handleIncomingUrl: (rawUrl: string | null) => Promise<void>,
): (() => void) => {
  void Linking.getInitialURL().then((url) => {
    void handleIncomingUrl(url);
  });

  const subscription = Linking.addEventListener("url", ({ url }) => {
    void handleIncomingUrl(url);
  });

  return createSubscriptionTeardown(subscription);
};

const createSubscriptionTeardown = (
  subscription: { remove: () => void },
): (() => void) => {
  return () => {
    subscription.remove();
  };
};

const bindAppStateLifecycle = (
  appStateRef: MutableRefObject<AppStateStatus>,
  setAppState: (value: RuntimeAppState) => void,
  revalidate: (reason: "foreground") => Promise<unknown>,
): (() => void) => {
  const subscription = AppState.addEventListener("change", (nextAppState) => {
    const previousAppState = appStateRef.current;
    appStateRef.current = nextAppState;
    setAppState(normalizeAppState(nextAppState));
    const shouldSync = shouldSyncOnForeground(previousAppState, nextAppState);

    runtimeLogger.log("runtime.app_state_changed", {
      context: {
        previousAppState,
        nextAppState,
        shouldSync,
      },
    });

    if (!shouldSync) {
      return;
    }

    void revalidate("foreground");
  });

  return createSubscriptionTeardown(subscription);
};

export const useRuntimeLifecycle = (enabled = true): void => {
  const queryClient = useQueryClient();
  const setAppState = useAppShellStore((state) => state.setAppState);
  const setConnectivityStatus = useAppShellStore(
    (state) => state.setConnectivityStatus,
  );
  const setRuntimeDegradedReason = useAppShellStore(
    (state) => state.setRuntimeDegradedReason,
  );
  const setPendingCheckoutReturn = useAppShellStore(
    (state) => state.setPendingCheckoutReturn,
  );
  const setLastHandledUrl = useAppShellStore(
    (state) => state.setLastHandledUrl,
  );
  const setEntitlementsVersion = useAppShellStore(
    (state) => state.setEntitlementsVersion,
  );
  const recordForegroundSync = useAppShellStore(
    (state) => state.recordForegroundSync,
  );
  const recordReachabilityCheck = useAppShellStore(
    (state) => state.recordReachabilityCheck,
  );
  const signOut = useSessionStore((state) => state.signOut);
  const markSessionValidated = useSessionStore(
    (state) => state.markSessionValidated,
  );
  const authFailureReason = useSessionStore((state) => state.authFailureReason);
  const lastInvalidatedAt = useSessionStore((state) => state.lastInvalidatedAt);

  const runtimeRevalidationService = useMemo(() => {
    return createRuntimeRevalidationService({
      queryClient,
      bootstrapService,
      subscriptionService,
      signOut,
      setEntitlementsVersion,
      recordForegroundSync,
      markSessionValidated,
    });
  }, [
    markSessionValidated,
    queryClient,
    recordForegroundSync,
    setEntitlementsVersion,
    signOut,
  ]);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastHandledInvalidationRef = useRef<string | null>(null);

  const probeConnectivity = useMemo(() => {
    return async (
      reason: RuntimeSyncReason,
    ) => {
      runtimeLogger.log("runtime.reachability_probe_started", {
        context: {
          reason,
        },
      });

      const result = await reachabilityService.probe();

      setConnectivityStatus(result.status);
      recordReachabilityCheck(result.checkedAt);
      setRuntimeDegradedReason(result.status === "online" ? null : result.degradedReason);

      runtimeLogger.log("runtime.reachability_probe_completed", {
        level: result.status === "online" ? "info" : "warn",
        context: {
          reason,
          status: result.status,
          degradedReason: result.degradedReason,
          latencyMs: result.latencyMs,
          statusCode: result.statusCode,
        },
      });

      return result;
    };
  }, [
    recordReachabilityCheck,
    setConnectivityStatus,
    setRuntimeDegradedReason,
  ]);

  const syncRuntime = useMemo(() => {
    return async (
      reason: RuntimeSyncReason,
    ): Promise<unknown> => {
      const probeResult = await probeConnectivity(reason);
      if (reason === "startup" || probeResult.status !== "online") {
        return null;
      }

      runtimeLogger.log("runtime.revalidation_started", {
        context: {
          reason,
        },
      });

      try {
        const result = await runtimeRevalidationService.revalidate(reason);
        setRuntimeDegradedReason(null);

        runtimeLogger.log("runtime.revalidation_completed", {
          level: result.signedOut ? "warn" : "info",
          context: {
            reason,
            revalidated: result.revalidated,
            signedOut: result.signedOut,
            entitlementsVersion: result.entitlementsVersion,
          },
        });

        return result;
      } catch (error) {
        setRuntimeDegradedReason(resolveRuntimeFailureReason(reason));
        runtimeLogger.log("runtime.revalidation_failed", {
          context: {
            reason,
          },
          error,
        });
        return null;
      }
    };
  }, [probeConnectivity, runtimeRevalidationService, setRuntimeDegradedReason]);

  const handleIncomingUrl = useMemo(
    () =>
      createIncomingUrlHandler({
        setPendingCheckoutReturn,
        setLastHandledUrl,
        revalidate: (reason) => syncRuntime(reason),
      }),
    [setLastHandledUrl, setPendingCheckoutReturn, syncRuntime],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setAppState(normalizeAppState(AppState.currentState));
  }, [enabled, setAppState]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void syncRuntime("startup");
  }, [enabled, syncRuntime]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return bindInitialUrlLifecycle(handleIncomingUrl);
  }, [enabled, handleIncomingUrl]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return bindAppStateLifecycle(
      appStateRef,
      setAppState,
      (reason) => syncRuntime(reason),
    );
  }, [enabled, setAppState, syncRuntime]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!authFailureReason || !lastInvalidatedAt) {
      return;
    }

    if (lastHandledInvalidationRef.current === lastInvalidatedAt) {
      return;
    }

    lastHandledInvalidationRef.current = lastInvalidatedAt;

    authLogger.log("auth.session_invalidated", {
      context: {
        reason: authFailureReason,
        invalidatedAt: lastInvalidatedAt,
      },
    });

    void resetRuntimeAfterSessionInvalidation({
      queryClient,
      setEntitlementsVersion,
      setPendingCheckoutReturn,
    });
  }, [
    enabled,
    authFailureReason,
    lastInvalidatedAt,
    queryClient,
    setEntitlementsVersion,
    setPendingCheckoutReturn,
  ]);
};
