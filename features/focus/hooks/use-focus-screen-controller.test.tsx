import { act, renderHook, waitFor } from "@testing-library/react-native";

import {
  useDashboardOverviewQuery,
  useDashboardTrendsQuery,
} from "@/features/dashboard/hooks/use-dashboard-overview-query";
import { useFocusScreenController } from "@/features/focus/hooks/use-focus-screen-controller";
import {
  loadPersistedFocusMetricId,
  persistFocusMetricId,
} from "@/features/focus/services/focus-storage";

jest.mock("@/features/dashboard/hooks/use-dashboard-overview-query", () => ({
  useDashboardOverviewQuery: jest.fn(),
  useDashboardTrendsQuery: jest.fn(),
}));

jest.mock("@/features/focus/services/focus-storage", () => ({
  loadPersistedFocusMetricId: jest.fn(),
  persistFocusMetricId: jest.fn(),
}));

const mockedOverview = jest.mocked(useDashboardOverviewQuery);
const mockedTrends = jest.mocked(useDashboardTrendsQuery);
const mockedLoad = jest.mocked(loadPersistedFocusMetricId);
const mockedPersist = jest.mocked(persistFocusMetricId);

beforeEach(() => {
  jest.clearAllMocks();
  mockedOverview.mockReturnValue({ data: undefined } as never);
  mockedTrends.mockReturnValue({ data: undefined } as never);
  mockedLoad.mockResolvedValue("freeBalanceAfterFixed");
  mockedPersist.mockResolvedValue();
});

describe("useFocusScreenController", () => {
  it("hidrata o id selecionado a partir do storage", async () => {
    mockedLoad.mockResolvedValue("monthlyBurnRate");
    const { result } = renderHook(() => useFocusScreenController());
    await waitFor(() => {
      expect(result.current.selectedMetricId).toBe("monthlyBurnRate");
    });
  });

  it("computa a metrica selecionada via calculator", async () => {
    mockedOverview.mockReturnValue({
      data: {
        month: "2026-04",
        totals: { incomeTotal: 100, expenseTotal: 70, balance: 30 },
        counts: {
          totalTransactions: 0,
          incomeTransactions: 0,
          expenseTransactions: 0,
          status: {},
        },
        topCategories: { expense: [], income: [] },
      },
    } as never);
    const { result } = renderHook(() => useFocusScreenController());
    await waitFor(() => {
      expect(result.current.metric.value).toBe(30);
    });
    expect(result.current.metric.unavailable).toBe(false);
  });

  it("handleSelectMetric atualiza estado e persiste", async () => {
    const { result } = renderHook(() => useFocusScreenController());
    await waitFor(() => {
      expect(result.current.selectedMetricId).toBe("freeBalanceAfterFixed");
    });
    act(() => {
      result.current.handleSelectMetric("monthlyExpenses");
    });
    expect(result.current.selectedMetricId).toBe("monthlyExpenses");
    expect(mockedPersist).toHaveBeenCalledWith("monthlyExpenses");
  });
});
