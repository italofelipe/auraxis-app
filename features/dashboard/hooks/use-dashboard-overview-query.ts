import { createApiQuery } from "@/core/query/create-api-query";
import type {
  DashboardOverview,
  DashboardOverviewFilters,
  DashboardTrends,
} from "@/features/dashboard/contracts";
import { dashboardService } from "@/features/dashboard/services/dashboard-service";

export const useDashboardOverviewQuery = (
  filters: DashboardOverviewFilters,
) => {
  return createApiQuery<DashboardOverview>(
    ["dashboard", "overview", filters],
    () => dashboardService.getOverview(filters),
  );
};

export const useDashboardTrendsQuery = (months = 6) => {
  return createApiQuery<DashboardTrends>(
    ["dashboard", "trends", months],
    () => dashboardService.getTrends(months),
  );
};
