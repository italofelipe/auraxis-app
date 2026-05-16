export type FeatureKey =
  | "basic_simulations"
  | "advanced_simulations"
  | "export_pdf"
  | "shared_entries"
  | "wallet_read"
  | "focus_mode";

export interface EntitlementCheckQuery {
  readonly featureKey: FeatureKey;
}

export interface EntitlementCheckResult {
  readonly featureKey: string;
  readonly active: boolean;
}
