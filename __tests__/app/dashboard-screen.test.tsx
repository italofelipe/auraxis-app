import type { MutableRefObject, ReactNode } from "react";

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { UseQueryResult } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

import DashboardScreen from "@/app/(private)/dashboard";
import type { ApiError } from "@/core/http/api-error";
import type { DashboardOverview, DashboardTrends } from "@/features/dashboard/contracts";
import { useDashboardScreenController } from "@/features/dashboard/hooks/use-dashboard-screen-controller";
import { useAiInsightConsent } from "@/features/insights/hooks/use-ai-insight-consent";
import type { UserInsight } from "@/features/insights/contracts";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { TestProviders } from "@/shared/testing/test-providers";

const mockScrollTo = jest.fn();

jest.mock("@/shared/components/app-screen", () => ({
  AppScreen: ({
    children,
    scrollViewRef,
  }: {
    readonly children: ReactNode;
    readonly scrollViewRef?: MutableRefObject<{
      scrollTo: typeof mockScrollTo;
    } | null>;
  }) => {
    if (scrollViewRef) {
      scrollViewRef.current = { scrollTo: mockScrollTo };
    }

    return children;
  },
}));

jest.mock("@/features/dashboard/hooks/use-dashboard-screen-controller", () => ({
  useDashboardScreenController: jest.fn(),
}));

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

jest.mock("@/features/insights/hooks/use-ai-insight-consent", () => ({
  useAiInsightConsent: jest.fn(),
}));

const mockedUseDashboardScreenController = jest.mocked(useDashboardScreenController);
const mockedUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);
const mockedUseAiInsightConsent = jest.mocked(useAiInsightConsent);

const buildQuery = <TData,>(
  overrides: Partial<UseQueryResult<TData, ApiError>>,
): UseQueryResult<TData, ApiError> =>
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
  }) as UseQueryResult<TData, ApiError>;

const insightData: UserInsight = {
  id: "ins-1",
  content: "Voce reduziu gastos variaveis sem cortar lazer.",
  keyMetric: "Voce economizou R$ 320 nesta semana",
  periodStart: "2026-05-04T00:00:00.000Z",
  periodEnd: "2026-05-10T23:59:59.000Z",
  status: "delivered",
  generatedAt: "2026-05-11T09:00:00.000Z",
  readAt: null,
};

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

type DashboardController = ReturnType<typeof useDashboardScreenController>;

const buildDashboardController = (
  overrides: Partial<DashboardController> = {},
): DashboardController =>
  ({
    overviewQuery: buildQuery({
      data: undefined,
    }) as unknown as DashboardController["overviewQuery"],
    trendsQuery: buildQuery({
      data: { months: 0, series: [] },
    }) as unknown as DashboardController["trendsQuery"],
    selectedMonth: "2026-04",
    monthOptions: [],
    monthSnapshot: null,
    currentBalance: 0,
    savingsRate: null,
    comparison: {
      current: null,
      previous: null,
      delta: null,
      percent: null,
    },
    weeklyInsight: {
      insight: insightData,
      isLoading: false,
      isNew: true,
      fetchLatest: jest.fn(),
      markAsRead: jest.fn(),
      query: buildQuery({ data: insightData }),
    },
    greetingName: "Italo",
    setSelectedMonth: jest.fn(),
    ...overrides,
  }) as DashboardController;

describe("DashboardScreen", () => {
  beforeEach(() => {
    mockScrollTo.mockClear();
    mockedUseLocalSearchParams.mockReturnValue({});
    mockedIsFeatureEnabled.mockReturnValue(true);
    mockedUseAiInsightConsent.mockReturnValue({
      isHydrated: true,
      hasConsent: true,
      grantedAt: "2026-05-17T01:00:00.000Z",
      grantConsent: jest.fn(),
    });
  });

  afterEach(() => {
    mockedUseDashboardScreenController.mockReset();
    mockedUseAiInsightConsent.mockReset();
  });

  it("renderiza o resumo e as opcoes mensais da tela canônica", () => {
    mockedUseDashboardScreenController.mockReturnValue(
      buildDashboardController({
        overviewQuery: buildQuery({
          data: overviewData,
        }) as unknown as DashboardController["overviewQuery"],
        trendsQuery: buildQuery({
          data: trendsData,
        }) as unknown as DashboardController["trendsQuery"],
        monthOptions: [{ value: "2026-04", label: "abril de 2026" }],
        monthSnapshot: {
          month: "2026-04",
          incomes: 3000,
          expenses: 1500,
          balance: 1500,
        },
        currentBalance: 1500,
        savingsRate: {
          rate: 0.5,
          level: "excellent",
          summary: "Excelente taxa de poupanca!",
        },
      }),
    );

    const { getByText } = render(
      <TestProviders>
        <DashboardScreen />
      </TestProviders>,
    );

    expect(getByText(/Saldo geral/u)).toBeTruthy();
    expect(getByText("Insight da semana")).toBeTruthy();
    expect(getByText("NOVO")).toBeTruthy();
    expect(getByText("Voce economizou R$ 320 nesta semana")).toBeTruthy();
    expect(getByText("abril de 2026")).toBeTruthy();
    expect(getByText(/Receitas:/u)).toBeTruthy();
  });

  it("scrolla ate o insight semanal quando a rota pede foco no card", async () => {
    mockedUseLocalSearchParams.mockReturnValue({ focus: "weekly-insight" });
    mockedUseDashboardScreenController.mockReturnValue(buildDashboardController());

    const { getByTestId } = render(
      <TestProviders>
        <DashboardScreen />
      </TestProviders>,
    );

    fireEvent(getByTestId("dashboard-weekly-insight-anchor"), "layout", {
      nativeEvent: {
        layout: {
          y: 148,
        },
      },
    });

    await waitFor(() => {
      expect(mockScrollTo).toHaveBeenCalledWith({ y: 132, animated: true });
    });
  });

  it("omite o card de insight semanal quando a feature flag esta desligada", () => {
    mockedIsFeatureEnabled.mockReturnValue(false);
    mockedUseDashboardScreenController.mockReturnValue(buildDashboardController());

    const { queryByText } = render(
      <TestProviders>
        <DashboardScreen />
      </TestProviders>,
    );

    expect(mockedUseDashboardScreenController).toHaveBeenCalledWith({
      weeklyInsightEnabled: false,
    });
    expect(queryByText("Insight da semana")).toBeNull();
  });

  it("nao busca insight semanal antes do consentimento de IA", () => {
    const grantConsent = jest.fn();
    mockedUseAiInsightConsent.mockReturnValue({
      isHydrated: true,
      hasConsent: false,
      grantedAt: null,
      grantConsent,
    });
    mockedUseDashboardScreenController.mockReturnValue(buildDashboardController());

    const { getByText, queryByText } = render(
      <TestProviders>
        <DashboardScreen />
      </TestProviders>,
    );

    expect(mockedUseDashboardScreenController).toHaveBeenCalledWith({
      weeklyInsightEnabled: false,
    });
    expect(getByText("Como usamos IA nos seus insights")).toBeTruthy();
    expect(queryByText("Voce economizou R$ 320 nesta semana")).toBeNull();

    fireEvent.press(getByText("Permitir insights informativos"));

    expect(grantConsent).toHaveBeenCalledTimes(1);
  });

  it("mantem rollback pela flag de transparencia sem bloquear o fluxo semanal", () => {
    mockedIsFeatureEnabled.mockImplementation((flagKey) => {
      return flagKey !== "app.insights.ai-transparency";
    });
    mockedUseAiInsightConsent.mockReturnValue({
      isHydrated: true,
      hasConsent: false,
      grantedAt: null,
      grantConsent: jest.fn(),
    });
    mockedUseDashboardScreenController.mockReturnValue(buildDashboardController());

    const { getByText, queryByText } = render(
      <TestProviders>
        <DashboardScreen />
      </TestProviders>,
    );

    expect(mockedUseDashboardScreenController).toHaveBeenCalledWith({
      weeklyInsightEnabled: true,
    });
    expect(getByText("Voce economizou R$ 320 nesta semana")).toBeTruthy();
    expect(queryByText("Como usamos IA nos seus insights")).toBeNull();
  });
});
