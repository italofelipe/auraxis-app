import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import type { CheckoutReturnIntent } from "@/core/navigation/deep-linking";
import type { SessionInvalidationReason } from "@/core/session/types";

export interface SessionFailurePresentation {
  readonly title: string;
  readonly description: string;
  readonly dismissLabel: string | null;
}

interface AuthenticatedQueryClient {
  cancelQueries: QueryClient["cancelQueries"];
  removeQueries: QueryClient["removeQueries"];
}

interface ResetRuntimeAfterSessionInvalidationDependencies {
  readonly queryClient: AuthenticatedQueryClient;
  readonly setEntitlementsVersion: (value: number | null) => void;
  readonly setPendingCheckoutReturn?: (
    value: CheckoutReturnIntent | null,
  ) => void;
}

export const authenticatedQueryRoots = [
  queryKeys.bootstrap.root,
  queryKeys.dashboard.root,
  queryKeys.transactions.root,
  queryKeys.goals.root,
  queryKeys.alerts.root,
  queryKeys.entitlements.root,
  queryKeys.userProfile.root,
  queryKeys.questionnaire.root,
  queryKeys.sharedEntries.root,
  queryKeys.subscription.root,
  queryKeys.wallet.root,
  queryKeys.fiscal.root,
  queryKeys.tools.root,
] as const;

/**
 * Clears every authenticated query root after a session drop.
 *
 * @param queryClient Runtime query client used by the app.
 * @returns Promise that resolves once protected caches are canceled and removed.
 */
export const clearAuthenticatedQueryCache = async (
  queryClient: AuthenticatedQueryClient,
): Promise<void> => {
  await Promise.all(
    authenticatedQueryRoots.map(async (queryKey) => {
      try {
        await queryClient.cancelQueries({ queryKey });
      } catch {
        // Removing the cache is more important than surfacing cancellation noise.
      }
      queryClient.removeQueries({ queryKey });
    }),
  );
};

/**
 * Resets shell-level runtime artifacts that cannot survive a session invalidation.
 *
 * @param dependencies Runtime callbacks from the provider layer.
 * @returns Promise that resolves when the authenticated runtime surface is clean.
 */
export const resetRuntimeAfterSessionInvalidation = async (
  dependencies: ResetRuntimeAfterSessionInvalidationDependencies,
): Promise<void> => {
  await clearAuthenticatedQueryCache(dependencies.queryClient);
  dependencies.setEntitlementsVersion(null);
  dependencies.setPendingCheckoutReturn?.(null);
};

/**
 * Maps invalidation reasons to canonical recovery copy shown in the public auth flow.
 *
 * @param reason Why the local session was invalidated.
 * @returns User-facing recovery notice or null when no notice should be shown.
 */
export const createSessionFailurePresentation = (
  reason: SessionInvalidationReason | null,
): SessionFailurePresentation | null => {
  switch (reason) {
    case "expired":
      return {
        title: "Sua sessao expirou",
        description: "Entre novamente para continuar com seguranca.",
        dismissLabel: "Fechar",
      };
    case "unauthorized":
      return {
        title: "Nao foi possivel validar sua sessao",
        description: "Entre novamente para continuar com seguranca.",
        dismissLabel: "Fechar",
      };
    case "forbidden":
      return {
        title: "Seu acesso precisa ser revalidado",
        description:
          "Entre novamente para recarregar as permissoes da sua conta.",
        dismissLabel: "Fechar",
      };
    case "bootstrap-invalid":
      return {
        title: "Nao foi possivel recuperar sua sessao",
        description:
          "A sessao salva neste dispositivo foi limpa com seguranca. Entre novamente para continuar.",
        dismissLabel: "Fechar",
      };
    case "manual":
    default:
      return null;
  }
};
