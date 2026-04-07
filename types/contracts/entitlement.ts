import type {
  EntitlementCheckQuery,
  EntitlementCheckResult,
  FeatureKey,
} from "@/features/entitlements/contracts";

export type { EntitlementCheckQuery, FeatureKey };

export interface EntitlementCheck {
  readonly has_access: boolean;
}

export type EntitlementCheckResponse =
  | EntitlementCheckResult
  | EntitlementCheck;
