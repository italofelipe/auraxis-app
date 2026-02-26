import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
import type { DashboardOverview } from "@/types/contracts";

interface DashboardApiClient {
  readonly get: AxiosInstance["get"];
}

export const dashboardPlaceholder: DashboardOverview = {
  currentBalance: 22340,
  monthly: [
    { month: "2026-01", incomes: 12000, expenses: 8000, balance: 4000 },
    { month: "2026-02", incomes: 14300, expenses: 9960, balance: 4340 },
    { month: "2026-03", incomes: 11800, expenses: 7800, balance: 4000 },
  ],
};

export const createDashboardApi = (client: DashboardApiClient) => {
  return {
    getOverview: async (): Promise<DashboardOverview> => {
      const response = await client.get<DashboardOverview>("/dashboard/overview");
      return response.data;
    },
  };
};

export const dashboardApi = createDashboardApi(httpClient);
