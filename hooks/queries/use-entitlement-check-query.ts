import { useQuery } from "@tanstack/react-query";

import { entitlementsApi } from "@/lib/entitlements-api";
import type { FeatureKey } from "@/types/contracts/entitlement";

export const useEntitlementCheckQuery = (
  featureKey: FeatureKey,
  enabled = true,
) => {
  return useQuery<boolean>({
    queryKey: ["entitlements", featureKey],
    enabled,
    queryFn: async (): Promise<boolean> => {
      return entitlementsApi.checkEntitlement(featureKey);
    },
  });
};
