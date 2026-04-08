import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  UpdateUserProfileCommand,
  UserProfile,
} from "@/features/user-profile/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface UserProfilePayload {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly gender: string | null;
  readonly birth_date: string | null;
  readonly monthly_income: number | null;
  readonly monthly_income_net: number | null;
  readonly net_worth: number | null;
  readonly monthly_expenses: number | null;
  readonly initial_investment: number | null;
  readonly monthly_investment: number | null;
  readonly investment_goal_date: string | null;
  readonly state_uf: string | null;
  readonly occupation: string | null;
  readonly investor_profile: UserProfile["investorProfile"];
  readonly financial_objectives: string | null;
  readonly investor_profile_suggested: string | null;
  readonly profile_quiz_score: number | null;
  readonly taxonomy_version: string | null;
}

const mapUserProfile = (payload: UserProfilePayload): UserProfile => {
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    gender: payload.gender,
    birthDate: payload.birth_date,
    monthlyIncome: payload.monthly_income,
    monthlyIncomeNet: payload.monthly_income_net,
    netWorth: payload.net_worth,
    monthlyExpenses: payload.monthly_expenses,
    initialInvestment: payload.initial_investment,
    monthlyInvestment: payload.monthly_investment,
    investmentGoalDate: payload.investment_goal_date,
    stateUf: payload.state_uf,
    occupation: payload.occupation,
    investorProfile: payload.investor_profile,
    financialObjectives: payload.financial_objectives,
    investorProfileSuggested: payload.investor_profile_suggested,
    profileQuizScore: payload.profile_quiz_score,
    taxonomyVersion: payload.taxonomy_version,
  };
};

const buildProfilePayload = (
  command: UpdateUserProfileCommand,
): Record<string, unknown> => {
  return {
    gender: command.gender,
    birth_date: command.birthDate,
    monthly_income: command.monthlyIncome,
    monthly_income_net: command.monthlyIncomeNet,
    net_worth: command.netWorth,
    monthly_expenses: command.monthlyExpenses,
    initial_investment: command.initialInvestment,
    monthly_investment: command.monthlyInvestment,
    investment_goal_date: command.investmentGoalDate,
    state_uf: command.stateUf,
    occupation: command.occupation,
    investor_profile: command.investorProfile,
    financial_objectives: command.financialObjectives,
  };
};

export const createUserProfileService = (client: AxiosInstance) => {
  return {
    getProfile: async (): Promise<UserProfile> => {
      const response = await client.get(apiContractMap.userProfileGet.path);
      const payload = unwrapEnvelopeData<{ readonly user: UserProfilePayload }>(
        response.data,
      );
      return mapUserProfile(payload.user);
    },
    updateProfile: async (
      command: UpdateUserProfileCommand,
    ): Promise<UserProfile> => {
      const response = await client.put(
        apiContractMap.userProfileUpdate.path,
        buildProfilePayload(command),
      );
      const payload = unwrapEnvelopeData<{ readonly user: UserProfilePayload }>(
        response.data,
      );
      return mapUserProfile(payload.user);
    },
  };
};

export const userProfileService = createUserProfileService(httpClient);
