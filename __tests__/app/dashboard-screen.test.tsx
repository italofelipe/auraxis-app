import { render } from "@testing-library/react-native";
import type { UseQueryResult } from "@tanstack/react-query";

import DashboardScreen from "@/app/(private)/dashboard";
import { AppProviders } from "@/core/providers/app-providers";
import type {
  DashboardOverview,
  DashboardTrends,
} from "@/features/dashboard/contracts";
import { useDashboardScreenController } from "@/features/dashboard/hooks/use-dashboard-screen-controller";

jest.mock("@/features/dashboard/hooks/use-dashboard-screen-controller", () => ({
  useDashboardScreenController: jest.fn(),
}));

const mockedUseDashboardScreenController = jest.mocked(
  useDashboardScreenController,
);

const buildQuery = <TData,>(
  overrides: Partial<UseQueryResult<TData, Error>>,
): UseQueryResult<TData, Error> =>
  ({
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    fetchStatus: "idle",
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    refetch: jest.fn(),
    status: "success",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    isEnabled: true,
    promise: Promise.resolve(undefined),
    ...overrides,
  }) as UseQueryResult<TData, Error>;

describe("DashboardScreen", () => {
  afterEach(() => {
    mockedUseDashboardScreenController.mockReset();
  });

  it("renderiza o resumo e as opcoes mensais da tela canônica", () => {
    const overviewData: DashboardOverview = {
      month: "2026-04",
      totals: {
        incomeTotal: 3000,
        expenseTotal: 1500,
        balance: 1500,
      },
      counts: {
        totalTransactions: 0,
        incomeTransactions: 0,
        expenseTransactions: 0,
        status: {},
      },
      topCategories: {
        expense: [],
        income: [],
      },
    };

    const trendsData: DashboardTrends = {
      months: 1,
      series: [
        {
          month: "2026-04",
          income: 3000,
          expenses: 1500,
          balance: 1500,
        },
      ],
    };

    mockedUseDashboardScreenController.mockReturnValue({
      overviewQuery: buildQuery({
        data: overviewData,
      }) as unknown as ReturnType<
        typeof useDashboardScreenController
      >["overviewQuery"],
      trendsQuery: buildQuery({
        data: trendsData,
      }) as unknown as ReturnType<
        typeof useDashboardScreenController
      >["trendsQuery"],
      selectedMonth: "2026-04",
      monthOptions: [{ value: "2026-04", label: "abril de 2026" }],
      monthSnapshot: {
        month: "2026-04",
        incomes: 3000,
        expenses: 1500,
        balance: 1500,
      },
      currentBalance: 1500,
      setSelectedMonth: jest.fn(),
    });

    const { getByText } = render(
      <AppProviders>
        <DashboardScreen />
      </AppProviders>,
    );

    expect(getByText("Saldo geral")).toBeTruthy();
    expect(getByText("abril de 2026")).toBeTruthy();
    expect(getByText(/Receitas:/u)).toBeTruthy();
  });
});
