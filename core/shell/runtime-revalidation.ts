import type { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/core/http/api-error";
import { queryKeys } from "@/core/query/query-keys";
import { useSessionStore } from "@/core/session/session-store";
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
  readonly signOut: () => Promise<void>;
  readonly setEntitlementsVersion: (value: number | null) => void;
  readonly recordForegroundSync: (timestamp: string) => void;
}

const isAuthenticationFailure = (error: unknown): error is ApiError => {
  return (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403)
  );
};

const clearAuthenticatedRuntimeCache = (queryClient: QueryClient): void => {
  queryClient.removeQueries({
    queryKey: queryKeys.bootstrap.root,
  });
  queryClient.removeQueries({
    queryKey: queryKeys.subscription.root,
  });
  queryClient.removeQueries({
    queryKey: queryKeys.entitlements.root,
  });
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
): Promise<RuntimeRevalidationResult> => {
  await dependencies.signOut();
  dependencies.setEntitlementsVersion(null);
  dependencies.recordForegroundSync(refreshedAt);
  clearAuthenticatedRuntimeCache(dependencies.queryClient);

  return {
    revalidated: false,
    signedOut: true,
    entitlementsVersion: null,
  };
};

export const createRuntimeRevalidationService = (
  dependencies: RuntimeRevalidationDependencies,
) => {
  return {
    revalidate: async (
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

        return createAuthenticationFailureResult(dependencies, refreshedAt);
      }
    },
  };
};
