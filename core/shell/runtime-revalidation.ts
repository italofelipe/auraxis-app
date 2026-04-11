import type { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/core/http/api-error";
import { queryKeys } from "@/core/query/query-keys";
import { resolveSessionInvalidationReason } from "@/core/session/session-policy";
import { resetRuntimeAfterSessionInvalidation } from "@/core/session/session-invalidation";
import { useSessionStore } from "@/core/session/session-store";
import type { SessionInvalidationReason } from "@/core/session/types";
import type { UserBootstrap } from "@/features/bootstrap/contracts";
import type { createBootstrapService } from "@/features/bootstrap/services/bootstrap-service";
import type { SubscriptionState } from "@/features/subscription/contracts";
import type { createSubscriptionService } from "@/features/subscription/services/subscription-service";

export type RuntimeRevalidationReason = "foreground" | "checkout-return";

export interface RuntimeRevalidationResult {
  readonly revalidated: boolean;
  readonly signedOut: boolean;
  readonly entitlementsVersion: number | null;
}

interface RuntimeRevalidationDependencies {
  readonly queryClient: QueryClient;
  readonly bootstrapService: Pick<
    ReturnType<typeof createBootstrapService>,
    "getBootstrap"
  >;
  readonly subscriptionService: Pick<
    ReturnType<typeof createSubscriptionService>,
    "getSubscription"
  >;
  readonly signOut: (reason?: SessionInvalidationReason) => Promise<void>;
  readonly setEntitlementsVersion: (value: number | null) => void;
  readonly recordForegroundSync: (timestamp: string) => void;
  readonly markSessionValidated: (timestamp: string) => void;
}

const isAuthenticationFailure = (error: unknown): error is ApiError => {
  return (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403)
  );
};

const syncAuthenticatedRuntime = async (
  dependencies: RuntimeRevalidationDependencies,
): Promise<UserBootstrap> => {
  const [bootstrap] = await Promise.all([
    dependencies.queryClient.fetchQuery<UserBootstrap>({
      queryKey: queryKeys.bootstrap.user(),
      queryFn: () => dependencies.bootstrapService.getBootstrap(),
      staleTime: 0,
    }),
    dependencies.queryClient.fetchQuery<SubscriptionState>({
      queryKey: queryKeys.subscription.me(),
      queryFn: () => dependencies.subscriptionService.getSubscription(),
      staleTime: 0,
    }),
  ]);

  return bootstrap;
};

const createUnauthenticatedResult = (
  dependencies: RuntimeRevalidationDependencies,
  refreshedAt: string,
): RuntimeRevalidationResult => {
  dependencies.setEntitlementsVersion(null);
  dependencies.recordForegroundSync(refreshedAt);

  return {
    revalidated: false,
    signedOut: false,
    entitlementsVersion: null,
  };
};

const createSuccessResult = (
  dependencies: RuntimeRevalidationDependencies,
  refreshedAt: string,
  entitlementsVersion: number,
): RuntimeRevalidationResult => {
  dependencies.setEntitlementsVersion(entitlementsVersion);
  dependencies.recordForegroundSync(refreshedAt);
  dependencies.markSessionValidated(refreshedAt);
  void dependencies.queryClient.invalidateQueries({
    queryKey: queryKeys.entitlements.root,
  });

  return {
    revalidated: true,
    signedOut: false,
    entitlementsVersion,
  };
};

const createAuthenticationFailureResult = async (
  dependencies: RuntimeRevalidationDependencies,
  refreshedAt: string,
  error: ApiError,
): Promise<RuntimeRevalidationResult> => {
  await dependencies.signOut(
    resolveSessionInvalidationReason(error.status) ?? "unauthorized",
  );
  dependencies.recordForegroundSync(refreshedAt);
  await resetRuntimeAfterSessionInvalidation({
    queryClient: dependencies.queryClient,
    setEntitlementsVersion: dependencies.setEntitlementsVersion,
  });

  return {
    revalidated: false,
    signedOut: true,
    entitlementsVersion: null,
  };
};

export const createRuntimeRevalidationService = (
  dependencies: RuntimeRevalidationDependencies,
) => {
  let inflightRevalidation: Promise<RuntimeRevalidationResult> | null = null;

  const performRevalidation = async (
    _reason: RuntimeRevalidationReason,
  ): Promise<RuntimeRevalidationResult> => {
    const refreshedAt = new Date().toISOString();
    const sessionState = useSessionStore.getState();

    if (!sessionState.isAuthenticated) {
      return createUnauthenticatedResult(dependencies, refreshedAt);
    }

    try {
      const bootstrap = await syncAuthenticatedRuntime(dependencies);
      const entitlementsVersion =
        bootstrap.user.productContext.entitlementsVersion;

      return createSuccessResult(
        dependencies,
        refreshedAt,
        entitlementsVersion,
      );
    } catch (error) {
      if (!isAuthenticationFailure(error)) {
        throw error;
      }

      return createAuthenticationFailureResult(
        dependencies,
        refreshedAt,
        error,
      );
    }
  };

  return {
    revalidate: async (
      reason: RuntimeRevalidationReason,
    ): Promise<RuntimeRevalidationResult> => {
      if (inflightRevalidation) {
        return inflightRevalidation;
      }

      inflightRevalidation = performRevalidation(reason).finally(() => {
        inflightRevalidation = null;
      });

      return inflightRevalidation;
    },
  };
};
