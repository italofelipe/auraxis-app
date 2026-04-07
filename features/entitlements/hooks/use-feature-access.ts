import { useMemo } from "react";

import { useEntitlementCheckQuery } from "@/features/entitlements/hooks/use-entitlement-check-query";
import type { FeatureKey } from "@/features/entitlements/contracts";

export interface FeatureAccessResult {
  readonly hasAccess: boolean;
  readonly isLoading: boolean;
}

/**
 * Canonical entitlement gate hook for premium-only app surfaces.
 *
 * @param featureKey Premium feature identifier published by the API.
 * @param enabled Allows callers to disable the query while session/bootstrap is unresolved.
 * @returns Simplified access state for view composition.
 */
export function useFeatureAccess(
  featureKey: FeatureKey,
  enabled = true,
): FeatureAccessResult {
  const entitlementQuery = useEntitlementCheckQuery(featureKey, enabled);

  return useMemo(
    () => ({
      hasAccess: entitlementQuery.data ?? false,
      isLoading: entitlementQuery.isPending,
    }),
    [entitlementQuery.data, entitlementQuery.isPending],
  );
}
