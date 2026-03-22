export type FeatureKey =
  | "basic_simulations"
  | "advanced_simulations"
  | "export_pdf"
  | "shared_entries"
  | "wallet_read";

export interface EntitlementCheck {
  readonly has_access: boolean;
}

export interface EntitlementCheckResponse {
  readonly active?: boolean;
  readonly has_access?: boolean;
  readonly feature_key?: string;
}
