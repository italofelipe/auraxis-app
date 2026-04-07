import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { entitlementsService } from "@/features/entitlements/services/entitlements-service";
import type { FeatureKey } from "@/types/contracts/entitlement";

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
