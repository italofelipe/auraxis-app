export type FeatureKey =
  | "basic_simulations"
  | "advanced_simulations"
  | "export_pdf"
  | "shared_entries"
  | "wallet_read";

export interface EntitlementCheck {
  readonly has_access: boolean;
}
