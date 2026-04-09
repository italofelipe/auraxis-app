import { render } from "@testing-library/react-native";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import AlertsScreen from "@/app/(private)/alertas";
import { useAlertsScreenController } from "@/features/alerts/hooks/use-alerts-screen-controller";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/features/alerts/hooks/use-alerts-screen-controller", () => ({
  useAlertsScreenController: jest.fn(),
}));

const mockedUseAlertsScreenController = jest.mocked(useAlertsScreenController);

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

const buildMutation = (): UseMutationResult<unknown, Error, unknown, unknown> =>
  ({
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isIdle: true,
    isPending: false,
    isPaused: false,
    isSuccess: false,
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
  }) as unknown as UseMutationResult<unknown, Error, unknown, unknown>;

describe("AlertsScreen", () => {
  afterEach(() => {
    mockedUseAlertsScreenController.mockReset();
  });

  it("renderiza a aba de alertas usando a composicao canonica da feature", () => {
    mockedUseAlertsScreenController.mockReturnValue({
      activeTab: "alerts",
      alertsQuery: buildQuery({
        data: {
          alerts: [
            {
              id: "alert-1",
              userId: "user-1",
              category: "payment_due",
              status: null,
              entityType: "transaction",
              entityId: "txn-1",
              triggeredAt: "2026-04-07T10:00:00Z",
              sentAt: null,
              createdAt: "2026-04-07T09:00:00Z",
            },
          ],
        },
      }) as ReturnType<typeof useAlertsScreenController>["alertsQuery"],
      preferencesQuery: buildQuery({
        data: {
          preferences: [],
        },
      }) as ReturnType<typeof useAlertsScreenController>["preferencesQuery"],
      markReadMutation: buildMutation() as ReturnType<
        typeof useAlertsScreenController
      >["markReadMutation"],
      deleteAlertMutation: buildMutation() as ReturnType<
        typeof useAlertsScreenController
      >["deleteAlertMutation"],
      updatePreferenceMutation: buildMutation() as ReturnType<
        typeof useAlertsScreenController
      >["updatePreferenceMutation"],
      setActiveTab: jest.fn(),
    });

    const { getAllByText, getByText } = render(
      <TestProviders>
        <AlertsScreen />
      </TestProviders>,
    );

    expect(getAllByText("Alertas").length).toBeGreaterThan(0);
    expect(getByText("Marcar lido")).toBeTruthy();
  });
});
