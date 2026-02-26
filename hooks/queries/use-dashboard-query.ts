import { useQuery } from "@tanstack/react-query";

import { dashboardApi, dashboardPlaceholder } from "@/lib/dashboard-api";
import type {
  DashboardOverview,
  MonthlySnapshot,
} from "@/types/contracts";

const emptySnapshot: MonthlySnapshot = {
  month: "1970-01",
  incomes: 0,
  expenses: 0,
  balance: 0,
};

export const selectMonthlySnapshot = (
  overview: DashboardOverview,
  month: string,
): MonthlySnapshot => {
  const found = overview.monthly.find((item) => item.month === month);

  if (found) {
    return found;
  }

  return overview.monthly[0] ?? emptySnapshot;
};

export const useDashboardOverviewQuery = () => {
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard", "overview"],
    queryFn: async (): Promise<DashboardOverview> => {
      try {
        return await dashboardApi.getOverview();
      } catch {
        return dashboardPlaceholder;
      }
    },
  });
};
