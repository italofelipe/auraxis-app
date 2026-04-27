import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  NotificationPreference,
  NotificationPreferenceListResponse,
  SalaryIncreaseSimulation,
  SimulateSalaryIncreaseCommand,
  UpdateNotificationPreferencesCommand,
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

interface NotificationPreferencePayload {
  readonly category: string;
  readonly enabled: boolean;
  readonly global_opt_out: boolean;
}

const mapNotificationPreference = (
  payload: NotificationPreferencePayload,
): NotificationPreference => ({
  category: payload.category,
  enabled: payload.enabled,
  globalOptOut: payload.global_opt_out,
});

const toNumeric = (value: number | string): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
    simulateSalaryIncrease: async (
      command: SimulateSalaryIncreaseCommand,
    ): Promise<SalaryIncreaseSimulation> => {
      const response = await client.post(
        apiContractMap.userSimulateSalary.path,
        {
          base_salary: command.baseSalary.toFixed(2),
          base_date: command.baseDate,
          discounts: command.discounts.toFixed(2),
          target_real_increase: command.targetRealIncrease.toFixed(2),
        },
      );
      const payload = unwrapEnvelopeData<{
        readonly recomposition?: number | string;
        readonly target?: number | string;
      }>(response.data);
      return {
        recomposition: toNumeric(payload.recomposition ?? 0),
        target: toNumeric(payload.target ?? 0),
      };
    },
    listNotificationPreferences:
      async (): Promise<NotificationPreferenceListResponse> => {
        const response = await client.get(
          apiContractMap.userNotificationPreferencesGet.path,
        );
        const payload = unwrapEnvelopeData<{
          readonly preferences?: NotificationPreferencePayload[];
        }>(response.data);
        return {
          preferences: (payload.preferences ?? []).map(mapNotificationPreference),
        };
      },
    updateNotificationPreferences: async (
      command: UpdateNotificationPreferencesCommand,
    ): Promise<NotificationPreferenceListResponse> => {
      const response = await client.patch(
        apiContractMap.userNotificationPreferencesUpdate.path,
        {
          preferences: command.preferences.map((pref) => ({
            category: pref.category,
            enabled: pref.enabled,
            global_opt_out: pref.globalOptOut,
          })),
        },
      );
      const payload = unwrapEnvelopeData<{
        readonly preferences?: NotificationPreferencePayload[];
      }>(response.data);
      return {
        preferences: (payload.preferences ?? []).map(mapNotificationPreference),
      };
    },
  };
};

export const userProfileService = createUserProfileService(httpClient);
