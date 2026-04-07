import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { dashboardService } from "@/features/dashboard/services/dashboard-service";
import type { DashboardOverview, MonthlySnapshot } from "@/types/contracts";

export const dashboardPlaceholder: DashboardOverview = {
  currentBalance: 22340,
  monthly: [
    { month: "2026-01", incomes: 12000, expenses: 8000, balance: 4000 },
    { month: "2026-02", incomes: 14300, expenses: 9960, balance: 4340 },
    { month: "2026-03", incomes: 11800, expenses: 7800, balance: 4000 },
  ],
};

const emptySnapshot: MonthlySnapshot = {
  month: "1970-01",
  incomes: 0,
  expenses: 0,
  balance: 0,
};

const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

const mapLegacyOverview = (
  overview: Awaited<ReturnType<typeof dashboardService.getOverview>>,
  trends: Awaited<ReturnType<typeof dashboardService.getTrends>>,
): DashboardOverview => {
  return {
    currentBalance: overview.totals.balance,
    monthly: trends.series.map((point) => ({
      month: point.month,
      incomes: point.income,
      expenses: point.expenses,
      balance: point.balance,
    })),
  };
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
    queryKey: queryKeys.dashboard.overview(),
    queryFn: async (): Promise<DashboardOverview> => {
      try {
        const [overview, trends] = await Promise.all([
          dashboardService.getOverview({ month: getCurrentMonth() }),
          dashboardService.getTrends(),
        ]);

        return mapLegacyOverview(overview, trends);
      } catch {
        return dashboardPlaceholder;
      }
    },
  });
};
