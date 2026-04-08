import type { UserProfileRecord } from "@/features/user-profile/contracts";

export const userProfileFixture: UserProfileRecord = {
  id: "user-1",
  name: "Italo Chagas",
  email: "italo@auraxis.com.br",
  gender: "masculino",
  birthDate: "1990-05-15",
  monthlyIncome: 9000,
  monthlyIncomeNet: 8200,
  netWorth: 180000,
  monthlyExpenses: 4200,
  initialInvestment: 30000,
  monthlyInvestment: 1200,
  investmentGoalDate: "2030-12-31",
  stateUf: "SP",
  occupation: "Founder",
  investorProfile: "explorador",
  financialObjectives: "independencia_financeira",
  investorProfileSuggested: "explorador",
  profileQuizScore: 9,
  taxonomyVersion: "2026-01",
};
