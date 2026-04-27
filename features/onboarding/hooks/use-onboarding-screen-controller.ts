import { useEffect, useState } from "react";

import {
  DEFAULT_ONBOARDING_STATE,
  type OnboardingFormData,
  type OnboardingState,
  type OnboardingStep1Data,
  type OnboardingStep2Data,
  type OnboardingStep3Data,
  type OnboardingStepNumber,
} from "@/features/onboarding/contracts";
import {
  clearPersistedOnboardingState,
  loadPersistedOnboardingState,
  persistOnboardingState,
} from "@/features/onboarding/services/onboarding-storage";

export interface OnboardingScreenController {
  readonly hydrated: boolean;
  readonly state: OnboardingState;
  readonly currentStep: OnboardingStepNumber;
  readonly formData: OnboardingFormData;
  readonly isCompleted: boolean;
  readonly isSkipped: boolean;
  readonly handleSubmitStep1: (data: OnboardingStep1Data) => Promise<void>;
  readonly handleSubmitStep2: (data: OnboardingStep2Data) => Promise<void>;
  readonly handleSubmitStep3: (data: OnboardingStep3Data) => Promise<void>;
  readonly handleSkip: () => Promise<void>;
  readonly handleReset: () => Promise<void>;
}

const advance = (
  state: OnboardingState,
  patch: Partial<OnboardingFormData>,
  nextStep: OnboardingStepNumber | null,
): OnboardingState => ({
  done: nextStep === null,
  skipped: false,
  currentStep: nextStep ?? state.currentStep,
  formData: { ...state.formData, ...patch },
});

export function useOnboardingScreenController(): OnboardingScreenController {
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPersistedOnboardingState().then((stored) => {
      if (!cancelled) {
        setState(stored);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const apply = async (next: OnboardingState): Promise<void> => {
    setState(next);
    await persistOnboardingState(next);
  };

  return {
    hydrated,
    state,
    currentStep: state.currentStep,
    formData: state.formData,
    isCompleted: state.done,
    isSkipped: state.skipped,
    handleSubmitStep1: async (data) => {
      await apply(advance(state, { step1: data }, 2));
    },
    handleSubmitStep2: async (data) => {
      await apply(advance(state, { step2: data }, 3));
    },
    handleSubmitStep3: async (data) => {
      await apply(advance(state, { step3: data }, null));
    },
    handleSkip: async () => {
      await apply({ ...state, skipped: true, done: true });
    },
    handleReset: async () => {
      await clearPersistedOnboardingState();
      setState({ ...DEFAULT_ONBOARDING_STATE, formData: {} });
    },
  };
}
