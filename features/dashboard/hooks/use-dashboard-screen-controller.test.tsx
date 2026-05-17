import { act, renderHook } from "@testing-library/react-native";

import type { AnalyticsClient } from "@/core/observability/analytics-types";
import { useAnalytics } from "@/core/observability/use-analytics";
import { useSessionStore } from "@/core/session/session-store";
import { useDashboardOverviewQuery, useDashboardTrendsQuery } from "@/features/dashboard/hooks/use-dashboard-overview-query";
import { useDashboardScreenController } from "@/features/dashboard/hooks/use-dashboard-screen-controller";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";

jest.mock("@/core/observability/use-analytics", () => ({
  useAnalytics: jest.fn(),
}));
jest.mock("@/features/dashboard/hooks/use-dashboard-overview-query", () => ({
  useDashboardOverviewQuery: jest.fn(),
  useDashboardTrendsQuery: jest.fn(),
}));
jest.mock("@/features/insights/hooks/use-weekly-insight-query", () => ({
  useWeeklyInsight: jest.fn(),
}));

const mockedUseAnalytics = jest.mocked(useAnalytics);
const mockedUseOverview = jest.mocked(useDashboardOverviewQuery);
const mockedUseTrends = jest.mocked(useDashboardTrendsQuery);
const mockedUseWeeklyInsight = jest.mocked(useWeeklyInsight);

const analyticsClient: jest.Mocked<AnalyticsClient> = {
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  screen: jest.fn(),
};

describe("useDashboardScreenController analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ user: { id: "usr-1", email: "x@y.test", name: "Italo" } as never });
    mockedUseAnalytics.mockReturnValue(analyticsClient);
    mockedUseOverview.mockReturnValue({
      data: { totals: { balance: 0 } },
    } as never);
    mockedUseTrends.mockReturnValue({
      data: {
        months: 2,
        series: [
          { month: "2026-05", income: 4000, expenses: 3000, balance: 1000 },
          { month: "2026-04", income: 3000, expenses: 2000, balance: 1000 },
        ],
      },
    } as never);
    mockedUseWeeklyInsight.mockReturnValue({
      insight: null,
      isLoading: false,
      isNew: false,
      fetchLatest: jest.fn(),
      markAsRead: jest.fn(),
      query: {},
    } as never);
  });

  it("captures dashboard.period.changed when the user changes month", () => {
    const { result } = renderHook(() => useDashboardScreenController());

    act(() => {
      result.current.setSelectedMonth("2026-04");
    });

    expect(analyticsClient.capture).toHaveBeenCalledWith(
      "dashboard.period.changed",
      { period: "2026-04" },
    );
  });
});
