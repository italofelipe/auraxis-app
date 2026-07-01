/**
 * E2E — Dashboard flow (RNTL + MSW)
 *
 * Integration tests for the dashboard feature domain.
 * Tests loading state, success state (balance/data), and error state using
 * service-layer mocks. MSW server lifecycle is maintained.
 *
 * Closes #375
 */
import { renderHook, waitFor } from "@testing-library/react-native";
// waitFor is used in multiple tests in this file

import { server } from "@/__mocks__/msw-server";
import { handlers } from "@/__tests__/e2e/handlers";
import { dashboardOverviewFixture, dashboardTrendsFixture } from "@/features/dashboard/mocks";
import { dashboardService } from "@/features/dashboard/services/dashboard-service";
import { createTestQueryClient } from "@/shared/testing/test-query-client";
import { createTestHookWrapper } from "@/shared/testing/test-providers";

// Setup MSW handlers for this suite (lifecycle integration)
beforeEach(() => {
  server.use(...handlers);
});

// ---------------------------------------------------------------------------
// Service-layer mocks
// ---------------------------------------------------------------------------
jest.mock("@/features/dashboard/services/dashboard-service", () => ({
  dashboardService: {
    getOverview: jest.fn(),
    getTrends: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
  usePathname: jest.fn(() => "/"),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

// Mock session store (dashboard reads user session for greeting name)
jest.mock("@/core/session/session-store", () => ({
  useSessionStore: (selector: (s: { session: null }) => unknown) =>
    selector({ session: null }),
}));

const mockedDashboardService = jest.mocked(dashboardService);
const waitForQuery = { timeout: 5000 } as const;

// ---------------------------------------------------------------------------
// Dashboard E2E: loading state, data, error state
// ---------------------------------------------------------------------------

describe("Dashboard E2E flow", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockedDashboardService.getOverview.mockResolvedValue(dashboardOverviewFixture);
    mockedDashboardService.getTrends.mockResolvedValue(dashboardTrendsFixture);
  });

  it("fetches overview data and exposes correct balance and totals", async () => {
    const {
      useDashboardOverviewQuery,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/dashboard/hooks/use-dashboard-overview-query");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(
      () => useDashboardOverviewQuery({ month: "2026-04" }),
      { wrapper },
    );

    // Initial state: loading
    expect(result.current.isPending).toBe(true);

    // After service resolves, data should be available
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    }, waitForQuery);

    expect(result.current.data?.totals.balance).toBe(
      dashboardOverviewFixture.totals.balance,
    );
    expect(result.current.data?.totals.incomeTotal).toBe(
      dashboardOverviewFixture.totals.incomeTotal,
    );
    expect(result.current.data?.totals.expenseTotal).toBe(
      dashboardOverviewFixture.totals.expenseTotal,
    );
  });

  it("screen controller computes correct currentBalance from overview data", async () => {
    const {
      useDashboardScreenController,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/dashboard/hooks/use-dashboard-screen-controller");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(
      () => useDashboardScreenController({ weeklyInsightEnabled: false }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.overviewQuery.isSuccess).toBe(true);
    }, waitForQuery);

    expect(typeof result.current.currentBalance).toBe("number");
    expect(result.current.currentBalance).toBe(
      dashboardOverviewFixture.totals.balance,
    );
  });

  it("returns error state when dashboard overview service rejects", async () => {
    mockedDashboardService.getOverview.mockRejectedValueOnce(
      new Error("Servico indisponivel"),
    );

    const {
      useDashboardOverviewQuery,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/dashboard/hooks/use-dashboard-overview-query");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(
      () => useDashboardOverviewQuery({ month: "2026-04" }),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      waitForQuery,
    );

    expect(result.current.data).toBeUndefined();
  });

  it("fetches trends data successfully with correct series length", async () => {
    const {
      useDashboardTrendsQuery,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/dashboard/hooks/use-dashboard-overview-query");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useDashboardTrendsQuery(6), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    }, waitForQuery);

    expect(result.current.data?.series).toBeDefined();
    expect(result.current.data?.series.length).toBe(
      dashboardTrendsFixture.series.length,
    );
  });

  it("month options are computed from trends data and selectedMonth is in YYYY-MM format", async () => {
    const {
      useDashboardScreenController,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/dashboard/hooks/use-dashboard-screen-controller");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(
      () => useDashboardScreenController({ weeklyInsightEnabled: false }),
      { wrapper },
    );

    // monthOptions derives from trendsQuery.data — wait for it to load
    await waitFor(() => {
      expect(result.current.trendsQuery.isSuccess).toBe(true);
    }, waitForQuery);

    expect(result.current.monthOptions.length).toBeGreaterThan(0);
    expect(typeof result.current.selectedMonth).toBe("string");
    expect(result.current.selectedMonth).toMatch(/^\d{4}-\d{2}$/);
  });

  it("top categories are accessible from dashboard overview data", async () => {
    const {
      useDashboardOverviewQuery,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/dashboard/hooks/use-dashboard-overview-query");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(
      () => useDashboardOverviewQuery({ month: "2026-04" }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    }, waitForQuery);

    expect(result.current.data?.topCategories.expense).toHaveLength(
      dashboardOverviewFixture.topCategories.expense.length,
    );
    expect(result.current.data?.topCategories.expense[0].categoryName).toBe(
      dashboardOverviewFixture.topCategories.expense[0].categoryName,
    );
  });
});
