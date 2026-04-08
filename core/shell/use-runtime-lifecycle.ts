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
import { createRuntimeRevalidationService } from "@/core/shell/runtime-revalidation";
import { useSessionStore } from "@/core/session/session-store";
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
      return;
    }

    const intent = parseAppUrl(rawUrl);
    if (!intent) {
      return;
    }

    dependencies.setLastHandledUrl(sanitizedUrl);

    if (intent.kind !== "checkout-return") {
      return;
    }

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

    if (!shouldSyncOnForeground(previousAppState, nextAppState)) {
      return;
    }

    void revalidate("foreground");
  });

  return () => {
    subscription.remove();
  };
};

export const useRuntimeLifecycle = (): void => {
  const queryClient = useQueryClient();
  const setAppState = useAppShellStore((state) => state.setAppState);
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
  const signOut = useSessionStore((state) => state.signOut);
  const markSessionValidated = useSessionStore(
    (state) => state.markSessionValidated,
  );

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

  const handleIncomingUrl = useMemo(
    () =>
      createIncomingUrlHandler({
      setPendingCheckoutReturn,
      setLastHandledUrl,
      revalidate: (reason) => runtimeRevalidationService.revalidate(reason),
      }),
    [runtimeRevalidationService, setLastHandledUrl, setPendingCheckoutReturn],
  );

  useEffect(() => {
    setAppState(normalizeAppState(AppState.currentState));
  }, [setAppState]);

  useEffect(() => {
    return bindInitialUrlLifecycle(handleIncomingUrl);
  }, [handleIncomingUrl]);

  useEffect(() => {
    return bindAppStateLifecycle(
      appStateRef,
      setAppState,
      (reason) => runtimeRevalidationService.revalidate(reason),
    );
  }, [runtimeRevalidationService, setAppState]);
};
