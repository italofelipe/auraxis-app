export type InvestorProfile = "conservador" | "explorador" | "entusiasta";

export interface UserProfileRecord {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly gender: string | null;
  readonly birthDate: string | null;
  readonly monthlyIncome: number | null;
  readonly monthlyIncomeNet: number | null;
  readonly netWorth: number | null;
  readonly monthlyExpenses: number | null;
  readonly initialInvestment: number | null;
  readonly monthlyInvestment: number | null;
  readonly investmentGoalDate: string | null;
  readonly stateUf: string | null;
  readonly occupation: string | null;
  readonly investorProfile: InvestorProfile | null;
  readonly financialObjectives: string | null;
  readonly investorProfileSuggested: string | null;
  readonly profileQuizScore: number | null;
  readonly taxonomyVersion: string | null;
}

export interface UpdateUserProfileCommand {
  readonly gender?: string | null;
  readonly birthDate?: string | null;
  readonly monthlyIncome?: number | null;
  readonly monthlyIncomeNet?: number | null;
  readonly netWorth?: number | null;
  readonly monthlyExpenses?: number | null;
  readonly initialInvestment?: number | null;
  readonly monthlyInvestment?: number | null;
  readonly investmentGoalDate?: string | null;
  readonly stateUf?: string | null;
  readonly occupation?: string | null;
  readonly investorProfile?: InvestorProfile | null;
  readonly financialObjectives?: string | null;
}

export type UserProfile = UserProfileRecord;

export interface SimulateSalaryIncreaseCommand {
  readonly baseSalary: number;
  readonly baseDate: string;
  readonly discounts: number;
  readonly targetRealIncrease: number;
}

export interface SalaryIncreaseSimulation {
  readonly recomposition: number;
  readonly target: number;
}

export interface NotificationPreference {
  readonly category: string;
  readonly enabled: boolean;
  readonly globalOptOut: boolean;
}

export interface NotificationPreferenceListResponse {
  readonly preferences: readonly NotificationPreference[];
}

export interface UpdateNotificationPreferencesCommand {
  readonly preferences: readonly NotificationPreference[];
}
