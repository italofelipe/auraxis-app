import * as SecureStore from "expo-secure-store";

export const ANALYTICS_OPT_OUT_STORAGE_KEY = "auraxis.analytics-opt-out.v1";

export interface AnalyticsOptOutPreference {
  readonly optedOut: boolean;
}

interface PersistedAnalyticsOptOutPreference {
  readonly version: 1;
  readonly optedOut: boolean;
}

const DEFAULT_PREFERENCE: AnalyticsOptOutPreference = {
  optedOut: false,
};

const hydrateAnalyticsOptOutPreference = (
  payload: unknown,
): AnalyticsOptOutPreference => {
  if (payload === null || typeof payload !== "object") {
    return DEFAULT_PREFERENCE;
  }

  const parsed = payload as Partial<PersistedAnalyticsOptOutPreference>;
  if (parsed.version !== 1 || typeof parsed.optedOut !== "boolean") {
    return DEFAULT_PREFERENCE;
  }

  return {
    optedOut: parsed.optedOut,
  };
};

export const loadAnalyticsOptOutPreference =
  async (): Promise<AnalyticsOptOutPreference> => {
    try {
      const payload = await SecureStore.getItemAsync(ANALYTICS_OPT_OUT_STORAGE_KEY);
      if (!payload) {
        return DEFAULT_PREFERENCE;
      }

      return hydrateAnalyticsOptOutPreference(JSON.parse(payload));
    } catch {
      return DEFAULT_PREFERENCE;
    }
  };

export const persistAnalyticsOptOutPreference = async (
  optedOut: boolean,
): Promise<AnalyticsOptOutPreference> => {
  const snapshot: AnalyticsOptOutPreference = { optedOut };
  const payload: PersistedAnalyticsOptOutPreference = {
    version: 1,
    optedOut,
  };

  await SecureStore.setItemAsync(
    ANALYTICS_OPT_OUT_STORAGE_KEY,
    JSON.stringify(payload),
  );

  return snapshot;
};
