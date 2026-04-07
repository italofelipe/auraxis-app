import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import { entitlementsService } from "@/features/entitlements/services/entitlements-service";
import type { EntitlementCheck, FeatureKey } from "@/types/contracts";

export const useEntitlementQuery = (featureKey: FeatureKey) => {
  return createApiQuery<EntitlementCheck>(queryKeys.entitlements.check(featureKey), async () => {
    const entitlement = await entitlementsService.checkEntitlement({ featureKey });
    return {
      has_access: entitlement.active,
    };
  });
};
