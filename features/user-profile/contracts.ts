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
