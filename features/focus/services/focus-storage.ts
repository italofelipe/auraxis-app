import * as SecureStore from "expo-secure-store";

import {
  DEFAULT_FOCUS_METRIC_ID,
  FOCUS_METRIC_IDS,
  FOCUS_SELECTED_METRIC_STORAGE_KEY,
  type FocusMetricId,
} from "@/features/focus/contracts";

const isFocusMetricId = (value: string | null): value is FocusMetricId => {
  return (
    value !== null &&
    (FOCUS_METRIC_IDS as readonly string[]).includes(value)
  );
};

export const loadPersistedFocusMetricId = async (): Promise<FocusMetricId> => {
  try {
    const stored = await SecureStore.getItemAsync(
      FOCUS_SELECTED_METRIC_STORAGE_KEY,
    );
    if (isFocusMetricId(stored)) {
      return stored;
    }
  } catch {
    return DEFAULT_FOCUS_METRIC_ID;
  }
  return DEFAULT_FOCUS_METRIC_ID;
};

export const persistFocusMetricId = async (
  metricId: FocusMetricId,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      FOCUS_SELECTED_METRIC_STORAGE_KEY,
      metricId,
    );
  } catch {
    // Storage unavailable — selection won't persist this turn.
  }
};
