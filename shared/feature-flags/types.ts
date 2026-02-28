export interface FeatureFlagDefinition {
  readonly key: string;
  readonly owner: string;
  readonly createdAt: string;
  readonly removeBy: string;
  readonly type: string;
  readonly status: string;
  readonly description: string;
  readonly repositories: readonly string[];
}

export interface FeatureFlagCatalog {
  readonly flags: readonly FeatureFlagDefinition[];
}
