import { useQuery } from "@tanstack/react-query";

import { entitlementApi } from "@/lib/entitlement-api";
import type { EntitlementCheck, FeatureKey } from "@/types/contracts";

export const useEntitlementQuery = (featureKey: FeatureKey) => {
  return useQuery<EntitlementCheck>({
    queryKey: ["entitlements", "check", featureKey],
    queryFn: async (): Promise<EntitlementCheck> => {
      return entitlementApi.checkEntitlement(featureKey);
    },
  });
};
