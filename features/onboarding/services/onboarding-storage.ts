import * as SecureStore from "expo-secure-store";

import {
  DEFAULT_ONBOARDING_STATE,
  ONBOARDING_STORAGE_KEY,
  type OnboardingState,
  type OnboardingStepNumber,
} from "@/features/onboarding/contracts";

const isStepNumber = (value: unknown): value is OnboardingStepNumber => {
  return value === 1 || value === 2 || value === 3;
};

const hydrate = (raw: unknown): OnboardingState => {
  if (raw === null || typeof raw !== "object") {
    return { ...DEFAULT_ONBOARDING_STATE, formData: {} };
  }
  const parsed = raw as Partial<OnboardingState>;
  return {
    done: parsed.done === true,
    skipped: parsed.skipped === true,
    currentStep: isStepNumber(parsed.currentStep) ? parsed.currentStep : 1,
    formData: parsed.formData ?? {},
  };
};

export const loadPersistedOnboardingState = async (): Promise<OnboardingState> => {
  try {
    const payload = await SecureStore.getItemAsync(ONBOARDING_STORAGE_KEY);
    if (!payload) {
      return { ...DEFAULT_ONBOARDING_STATE, formData: {} };
    }
    return hydrate(JSON.parse(payload));
  } catch {
    return { ...DEFAULT_ONBOARDING_STATE, formData: {} };
  }
};

export const persistOnboardingState = async (
  state: OnboardingState,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // Storage unavailable — state won't persist this turn.
  }
};

export const clearPersistedOnboardingState = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(ONBOARDING_STORAGE_KEY);
  } catch {
    // Storage unavailable — nothing to clear.
  }
};
