import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  DashboardOverview,
  DashboardOverviewFilters,
  DashboardTrends,
} from "@/features/dashboard/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface DashboardOverviewPayload {
  readonly month: string;
  readonly totals: {
    readonly income_total: number;
    readonly expense_total: number;
    readonly balance: number;
  };
  readonly counts: {
    readonly total_transactions: number;
    readonly income_transactions: number;
    readonly expense_transactions: number;
    readonly status: Record<string, number>;
  };
  readonly top_categories: {
    readonly expense: {
      readonly tag_id: string | null;
      readonly category_name: string;
      readonly total_amount: number;
      readonly transactions_count: number;
    }[];
    readonly income: {
      readonly tag_id: string | null;
      readonly category_name: string;
      readonly total_amount: number;
      readonly transactions_count: number;
    }[];
  };
}

const mapOverview = (payload: DashboardOverviewPayload): DashboardOverview => {
  return {
    month: payload.month,
    totals: {
      incomeTotal: payload.totals.income_total,
      expenseTotal: payload.totals.expense_total,
      balance: payload.totals.balance,
    },
    counts: {
      totalTransactions: payload.counts.total_transactions,
      incomeTransactions: payload.counts.income_transactions,
      expenseTransactions: payload.counts.expense_transactions,
      status: payload.counts.status,
    },
    topCategories: {
      expense: payload.top_categories.expense.map((item) => ({
        tagId: item.tag_id,
        categoryName: item.category_name,
        totalAmount: item.total_amount,
        transactionsCount: item.transactions_count,
      })),
      income: payload.top_categories.income.map((item) => ({
        tagId: item.tag_id,
        categoryName: item.category_name,
        totalAmount: item.total_amount,
        transactionsCount: item.transactions_count,
      })),
    },
  };
};

export const createDashboardService = (client: AxiosInstance) => {
  return {
    getOverview: async (
      filters: DashboardOverviewFilters,
    ): Promise<DashboardOverview> => {
      const response = await client.get(apiContractMap.dashboardOverview.path, {
        params: {
          month: filters.month,
        },
      });

      return mapOverview(
        unwrapEnvelopeData<DashboardOverviewPayload>(response.data),
      );
    },
    getTrends: async (months = 6): Promise<DashboardTrends> => {
      const response = await client.get(apiContractMap.dashboardTrends.path, {
        params: {
          months,
        },
      });

      return unwrapEnvelopeData<DashboardTrends>(response.data);
    },
  };
};

export const dashboardService = createDashboardService(httpClient);
