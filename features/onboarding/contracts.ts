export type OnboardingStepNumber = 1 | 2 | 3;

export type OnboardingInvestorProfile =
  | "conservador"
  | "explorador"
  | "entusiasta";

export type OnboardingTransactionType = "income" | "expense";

export interface OnboardingStep1Data {
  readonly monthlyIncome: number;
  readonly investorProfile: OnboardingInvestorProfile;
}

export interface OnboardingStep2Data {
  readonly title: string;
  readonly amount: number;
  readonly transactionType: OnboardingTransactionType;
  readonly dueDate: string;
}

export interface OnboardingStep3Data {
  readonly name: string;
  readonly targetAmount: number;
  readonly targetDate: string;
}

export interface OnboardingFormData {
  readonly step1?: OnboardingStep1Data;
  readonly step2?: OnboardingStep2Data;
  readonly step3?: OnboardingStep3Data;
}

export interface OnboardingState {
  readonly done: boolean;
  readonly skipped: boolean;
  readonly currentStep: OnboardingStepNumber;
  readonly formData: OnboardingFormData;
}

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  done: false,
  skipped: false,
  currentStep: 1,
  formData: {},
};

export const ONBOARDING_STORAGE_KEY = "auraxis.onboarding.state";
