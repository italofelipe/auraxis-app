export {
  fetchUnleashSnapshot,
  getLocalFlag,
  getProviderMode,
  isFeatureEnabled,
  resetProviderCache,
  resolveEnvOverride,
  resolveProviderDecision,
  toEnvSuffix,
} from "@/shared/feature-flags/service";
export type { FeatureFlagCatalog, FeatureFlagDefinition } from "@/shared/feature-flags/types";
