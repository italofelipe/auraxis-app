import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Linking } from "react-native";

import { ApiError } from "@/core/http/api-error";
import type { AnalyticsClient } from "@/core/observability/analytics-types";
import { useAnalytics } from "@/core/observability/use-analytics";
import type { SubscriptionState } from "@/features/subscription/contracts";
import { useSubscriptionManagementController } from "@/features/subscription/hooks/use-subscription-management-controller";
import { useCancelSubscriptionMutation } from "@/features/subscription/hooks/use-subscription-mutations";
import {
  APPLE_SUBSCRIPTIONS_URL,
  MANAGE_SUBSCRIPTION_URL,
} from "@/shared/config/web-urls";

jest.mock("@/features/subscription/hooks/use-subscription-mutations", () => ({
  useCancelSubscriptionMutation: jest.fn(),
}));
jest.mock("@/core/observability/use-analytics", () => ({
  useAnalytics: jest.fn(),
}));

const mockedUseCancel = jest.mocked(useCancelSubscriptionMutation);
const mockedUseAnalytics = jest.mocked(useAnalytics);
const analyticsClient: jest.Mocked<AnalyticsClient> = {
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  screen: jest.fn(),
};

const buildSubscription = (
  override: Partial<SubscriptionState> = {},
): SubscriptionState => ({
  id: "sub-1",
  userId: "user-1",
  planCode: "premium",
  offerCode: null,
  status: "active",
  billingCycle: "monthly",
  provider: "abacatepay",
  providerSubscriptionId: "provider-sub-1",
  trialEndsAt: null,
  currentPeriodStart: "2026-07-01T00:00:00Z",
  currentPeriodEnd: "2026-08-01T00:00:00Z",
  canceledAt: null,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  ...override,
});

let client: QueryClient;
let cancelMutateAsync: jest.Mock;
let cancelReset: jest.Mock;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  cancelMutateAsync = jest.fn();
  cancelReset = jest.fn();
  mockedUseCancel.mockReturnValue({
    mutateAsync: cancelMutateAsync,
    reset: cancelReset,
    isPending: false,
    error: null,
  } as never);
  mockedUseAnalytics.mockReturnValue(analyticsClient);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("subscription management via API", () => {
  it("abre confirmacao local sem navegar para outra URL", async () => {
    const openUrlSpy = jest.spyOn(Linking, "openURL");
    const { result } = renderHook(
      () => useSubscriptionManagementController(buildSubscription()),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleManageSubscription();
    });

    expect(result.current.managementAction?.mode).toBe("api");
    expect(result.current.isCancelConfirmationOpen).toBe(true);
    expect(openUrlSpy).not.toHaveBeenCalled();
  });

  it("atualiza cache e invalida assinatura e entitlements no sucesso", async () => {
    const active = buildSubscription();
    const canceled = buildSubscription({
      status: "canceled",
      canceledAt: "2026-07-23T22:00:00Z",
    });
    cancelMutateAsync.mockResolvedValueOnce(canceled);
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(
      () => useSubscriptionManagementController(active),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleCancelSubscription();
    });

    expect(client.getQueryData(["subscription", "me"])).toEqual(canceled);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["subscription"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["entitlements"],
    });
    expect(result.current.lastCanceledSubscription).toEqual(canceled);
    expect(analyticsClient.capture).toHaveBeenCalledWith(
      "subscription.cancel.completed",
      {
        provider: "abacatepay",
        mode: "api",
        status: "completed",
      },
    );
  });

  it("impede duas requisicoes simultaneas", async () => {
    let resolveCancellation: ((value: SubscriptionState) => void) | undefined;
    cancelMutateAsync.mockImplementationOnce(
      () =>
        new Promise<SubscriptionState>((resolve) => {
          resolveCancellation = resolve;
        }),
    );
    const { result } = renderHook(
      () => useSubscriptionManagementController(buildSubscription()),
      { wrapper },
    );

    let firstRequest: Promise<void> | undefined;
    await act(async () => {
      firstRequest = result.current.handleCancelSubscription();
      await result.current.handleCancelSubscription();
    });
    expect(cancelMutateAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCancellation?.(buildSubscription({ status: "canceled" }));
      await firstRequest;
    });
  });

  it("mantem confirmacao aberta e permite retry depois de erro", async () => {
    cancelMutateAsync
      .mockRejectedValueOnce(
        new ApiError({ message: "billing unavailable", status: 503 }),
      )
      .mockResolvedValueOnce(buildSubscription({ status: "canceled" }));
    const { result } = renderHook(
      () => useSubscriptionManagementController(buildSubscription()),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleManageSubscription();
      await result.current.handleCancelSubscription();
    });
    expect(result.current.cancelError).toBeInstanceOf(ApiError);
    expect(result.current.isCancelConfirmationOpen).toBe(true);

    await act(async () => {
      await result.current.handleCancelSubscription();
    });
    expect(cancelMutateAsync).toHaveBeenCalledTimes(2);
  });
});

describe("subscription management via external owner", () => {
  it("abre a gestao oficial da App Store", async () => {
    const openUrlSpy = jest
      .spyOn(Linking, "openURL")
      .mockResolvedValueOnce(true as never);
    const { result } = renderHook(
      () =>
        useSubscriptionManagementController(
          buildSubscription({ provider: "app_store" }),
        ),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleManageSubscription();
    });

    expect(openUrlSpy).toHaveBeenCalledWith(APPLE_SUBSCRIPTIONS_URL);
    expect(result.current.isCancelConfirmationOpen).toBe(false);
  });

  it("usa a pagina Web canonica para provider desconhecido", async () => {
    const openUrlSpy = jest
      .spyOn(Linking, "openURL")
      .mockResolvedValueOnce(true as never);
    const { result } = renderHook(
      () =>
        useSubscriptionManagementController(
          buildSubscription({ provider: "future-provider" }),
        ),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleManageSubscription();
    });

    expect(openUrlSpy).toHaveBeenCalledWith(MANAGE_SUBSCRIPTION_URL);
  });

  it("expoe erro recuperavel quando o Linking falha", async () => {
    jest
      .spyOn(Linking, "openURL")
      .mockRejectedValueOnce(new Error("cannot open"));
    const { result } = renderHook(
      () =>
        useSubscriptionManagementController(
          buildSubscription({ provider: "app_store" }),
        ),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleManageSubscription();
    });
    expect(result.current.managementError).toEqual(
      expect.objectContaining({ message: "cannot open" }),
    );

    act(() => {
      result.current.dismissManagementError();
    });
    expect(result.current.managementError).toBeNull();
  });
});
