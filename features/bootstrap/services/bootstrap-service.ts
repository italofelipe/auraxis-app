import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  UserBootstrap,
  UserBootstrapQuery,
} from "@/features/bootstrap/contracts";

interface BootstrapPayload {
  readonly user: {
    readonly identity: {
      readonly id: string;
      readonly name: string;
      readonly email: string;
    };
    readonly profile: {
      readonly gender: string | null;
      readonly birth_date: string | null;
      readonly state_uf: string | null;
      readonly occupation: string | null;
    };
    readonly financial_profile: {
      readonly monthly_income_net: number | null;
      readonly monthly_expenses: number | null;
      readonly net_worth: number | null;
      readonly initial_investment: number | null;
      readonly monthly_investment: number | null;
      readonly investment_goal_date: string | null;
    };
    readonly investor_profile: {
      readonly declared: string | null;
      readonly suggested: string | null;
      readonly quiz_score: number | null;
      readonly taxonomy_version: string | null;
      readonly financial_objectives: string | null;
    };
    readonly product_context: {
      readonly entitlements_version: number;
    };
  };
  readonly transactions_preview: {
    readonly items: {
      readonly id: string;
      readonly title: string;
      readonly amount: string;
      readonly type: string;
      readonly status: string;
    }[];
    readonly returned_items: number;
    readonly limit: number;
    readonly has_more: boolean;
  };
  readonly wallet: {
    readonly items: {
      readonly id: string;
      readonly name: string;
      readonly value: number | null;
      readonly estimated_value_on_create_date: number | null;
      readonly ticker: string | null;
      readonly quantity: number | null;
      readonly asset_class: string;
      readonly annual_rate: number | null;
      readonly target_withdraw_date: string | null;
      readonly register_date: string;
      readonly should_be_on_wallet: boolean;
    }[];
    readonly total: number;
    readonly returned_items: number;
    readonly limit: number;
    readonly has_more: boolean;
  };
}

const mapBootstrapPayload = (payload: BootstrapPayload): UserBootstrap => {
  return {
    user: {
      identity: payload.user.identity,
      profile: {
        gender: payload.user.profile.gender,
        birthDate: payload.user.profile.birth_date,
        stateUf: payload.user.profile.state_uf,
        occupation: payload.user.profile.occupation,
      },
      financialProfile: {
        monthlyIncomeNet: payload.user.financial_profile.monthly_income_net,
        monthlyExpenses: payload.user.financial_profile.monthly_expenses,
        netWorth: payload.user.financial_profile.net_worth,
        initialInvestment: payload.user.financial_profile.initial_investment,
        monthlyInvestment: payload.user.financial_profile.monthly_investment,
        investmentGoalDate: payload.user.financial_profile.investment_goal_date,
      },
      investorProfile: {
        declared: payload.user.investor_profile.declared,
        suggested: payload.user.investor_profile.suggested,
        quizScore: payload.user.investor_profile.quiz_score,
        taxonomyVersion: payload.user.investor_profile.taxonomy_version,
        financialObjectives: payload.user.investor_profile.financial_objectives,
      },
      productContext: {
        entitlementsVersion: payload.user.product_context.entitlements_version,
      },
    },
    transactionsPreview: {
      items: payload.transactions_preview.items,
      returnedItems: payload.transactions_preview.returned_items,
      limit: payload.transactions_preview.limit,
      hasMore: payload.transactions_preview.has_more,
    },
    wallet: {
      items: payload.wallet.items.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
        estimatedValueOnCreateDate: item.estimated_value_on_create_date,
        ticker: item.ticker,
        quantity: item.quantity,
        assetClass: item.asset_class,
        annualRate: item.annual_rate,
        targetWithdrawDate: item.target_withdraw_date,
        registerDate: item.register_date,
        shouldBeOnWallet: item.should_be_on_wallet,
      })),
      total: payload.wallet.total,
      returnedItems: payload.wallet.returned_items,
      limit: payload.wallet.limit,
      hasMore: payload.wallet.has_more,
    },
  };
};

export const createBootstrapService = (client: AxiosInstance) => {
  return {
    getBootstrap: async (
      query: UserBootstrapQuery = {},
    ): Promise<UserBootstrap> => {
      const response = await client.get("/user/bootstrap", {
        params: {
          transactions_limit: query.transactionsLimit,
        },
      });

      return mapBootstrapPayload(
        unwrapEnvelopeData<BootstrapPayload>(response.data),
      );
    },
  };
};

export const bootstrapService = createBootstrapService(httpClient);
