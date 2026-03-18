import { useEntitlementQuery } from "@/hooks/queries/use-entitlement-query";
import type { FeatureKey } from "@/types/contracts";

export interface FeatureAccessResult {
  readonly hasAccess: boolean;
  readonly isLoading: boolean;
}

export const useFeatureAccess = (featureKey: FeatureKey): FeatureAccessResult => {
  const { data, isPending } = useEntitlementQuery(featureKey);

  return {
    hasAccess: data?.has_access ?? false,
    isLoading: isPending,
  };
};
