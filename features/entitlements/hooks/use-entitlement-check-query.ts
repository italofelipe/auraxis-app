import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { entitlementsService } from "@/features/entitlements/services/entitlements-service";
import type { FeatureKey } from "@/types/contracts/entitlement";

/**
 * Resolves whether the authenticated user has access to a premium feature.
 *
 * @param featureKey Entitlement key published by the API.
 * @param enabled Allows callers to disable the query when the session is absent.
 * @returns Query result normalized to a boolean access flag.
 */
export const useEntitlementCheckQuery = (
  featureKey: FeatureKey,
  enabled = true,
) => {
  return useQuery<boolean>({
    queryKey: queryKeys.entitlements.access(featureKey),
    enabled,
    queryFn: async (): Promise<boolean> => {
      const entitlement = await entitlementsService.checkEntitlement({ featureKey });
      return entitlement.active;
    },
  });
};
