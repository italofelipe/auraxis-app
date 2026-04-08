import { render } from "@testing-library/react-native";
import type { UseQueryResult } from "@tanstack/react-query";

import SubscriptionScreen from "@/app/(private)/assinatura";
import { AppProviders } from "@/core/providers/app-providers";
import type { SubscriptionState } from "@/features/subscription/contracts";
import { useSubscriptionScreenController } from "@/features/subscription/hooks/use-subscription-screen-controller";

jest.mock("@/features/subscription/hooks/use-subscription-screen-controller", () => ({
  useSubscriptionScreenController: jest.fn(),
}));

const mockedUseSubscriptionScreenController = jest.mocked(
  useSubscriptionScreenController,
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

describe("SubscriptionScreen", () => {
  afterEach(() => {
    mockedUseSubscriptionScreenController.mockReset();
  });

  it("renderiza o estado da assinatura usando a composicao canônica", () => {
    const subscriptionData: SubscriptionState = {
      id: "sub-1",
      userId: "user-1",
      planCode: "premium_monthly",
      offerCode: "premium",
      status: "active",
      billingCycle: "monthly",
      provider: "asaas",
      providerSubscriptionId: "asaas-sub-1",
      currentPeriodStart: "2026-04-01T00:00:00Z",
      currentPeriodEnd: "2026-04-30T00:00:00Z",
      trialEndsAt: null,
      canceledAt: null,
      createdAt: "2026-04-01T00:00:00Z",
      updatedAt: "2026-04-01T00:00:00Z",
    };

    mockedUseSubscriptionScreenController.mockReturnValue({
      subscriptionQuery: buildQuery({
        data: subscriptionData,
      }) as unknown as ReturnType<
        typeof useSubscriptionScreenController
      >["subscriptionQuery"],
      handleManageSubscription: jest.fn().mockResolvedValue(undefined),
    });

    const { getByText } = render(
      <AppProviders>
        <SubscriptionScreen />
      </AppProviders>,
    );

    expect(getByText("Assinatura")).toBeTruthy();
    expect(getByText("Gerenciar assinatura")).toBeTruthy();
  });
});
