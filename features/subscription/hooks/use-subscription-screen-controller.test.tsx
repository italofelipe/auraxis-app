import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ApiError } from "@/core/http/api-error";
import type {
  BillingPlan,
  SubscriptionState,
} from "@/features/subscription/contracts";
import { useBillingPlansQuery } from "@/features/subscription/hooks/use-billing-plans-query";
import { useCheckoutFlow } from "@/features/subscription/hooks/use-checkout-flow";
import { useStartTrialMutation } from "@/features/subscription/hooks/use-subscription-mutations";
import { useSubscriptionStateQuery } from "@/features/subscription/hooks/use-subscription-query";
import { useSubscriptionScreenController } from "@/features/subscription/hooks/use-subscription-screen-controller";

jest.mock("@/features/subscription/hooks/use-billing-plans-query", () => ({
  useBillingPlansQuery: jest.fn(),
}));
jest.mock("@/features/subscription/hooks/use-subscription-query", () => ({
  useSubscriptionStateQuery: jest.fn(),
}));
jest.mock("@/features/subscription/hooks/use-subscription-mutations", () => ({
  useStartTrialMutation: jest.fn(),
}));
jest.mock("@/features/subscription/hooks/use-checkout-flow", () => ({
  useCheckoutFlow: jest.fn(),
}));

const mockedUsePlans = jest.mocked(useBillingPlansQuery);
const mockedUseSubscription = jest.mocked(useSubscriptionStateQuery);
const mockedUseTrial = jest.mocked(useStartTrialMutation);
const mockedUseCheckout = jest.mocked(useCheckoutFlow);

const buildPlan = (override: Partial<BillingPlan> = {}): BillingPlan => ({
  slug: "premium-monthly",
  planCode: "premium",
  tier: "premium",
  billingCycle: "monthly",
  displayName: "Premium",
  description: "Plano",
  priceCents: 1990,
  currency: "BRL",
  trialDays: 30,
  checkoutEnabled: true,
  highlighted: false,
  ...override,
});

const buildSubscription = (
  override: Partial<SubscriptionState> = {},
): SubscriptionState => ({
  id: "sub-1",
  userId: "u-1",
  planCode: "free",
  offerCode: null,
  status: "free",
  billingCycle: null,
  provider: null,
  providerSubscriptionId: null,
  trialEndsAt: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  canceledAt: null,
  createdAt: null,
  updatedAt: null,
  ...override,
});

const wrapper = (client: QueryClient) => {
  const Provider = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Provider.displayName = "TestQueryClientProvider";
  return Provider;
};

describe("useSubscriptionScreenController", () => {
  let client: QueryClient;
  let checkoutStart: jest.Mock;
  let trialMutateAsync: jest.Mock;
  let trialReset: jest.Mock;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    checkoutStart = jest.fn().mockResolvedValue({ outcome: "completed" });
    trialMutateAsync = jest.fn().mockResolvedValue(buildSubscription());
    trialReset = jest.fn();
    mockedUsePlans.mockReturnValue({ data: [buildPlan()] } as never);
    mockedUseSubscription.mockReturnValue({ data: buildSubscription() } as never);
    mockedUseTrial.mockReturnValue({
      mutateAsync: trialMutateAsync,
      reset: trialReset,
      isPending: false,
      error: null,
    } as never);
    mockedUseCheckout.mockReturnValue({
      isStarting: false,
      lastError: null,
      start: checkoutStart,
      resetError: jest.fn(),
    } as never);
  });

  it("expoe presentations e trial offer derivados do comparador", () => {
    const { result } = renderHook(() => useSubscriptionScreenController(), {
      wrapper: wrapper(client),
    });
    expect(result.current.presentations).toHaveLength(1);
    expect(result.current.trialOffer?.planCode).toBe("premium");
  });

  it("dispara checkout via fluxo orquestrado e captura outcome", async () => {
    const { result } = renderHook(() => useSubscriptionScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleSubscribe(buildPlan());
    });

    expect(checkoutStart).toHaveBeenCalledWith({
      planSlug: "premium-monthly",
      billingCycle: "monthly",
    });
    expect(result.current.lastCheckoutOutcome).toBe("completed");
  });

  it("inicia trial e invalida subscription/entitlements ao concluir", async () => {
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useSubscriptionScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleStartTrial();
    });

    expect(trialMutateAsync).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["subscription"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["entitlements"] }),
    );
  });

  it("captura erro de trial em trialError sem propagar", async () => {
    trialMutateAsync.mockRejectedValueOnce(
      new ApiError({ message: "trial fail", status: 409 }),
    );
    const { result } = renderHook(() => useSubscriptionScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleStartTrial();
    });

    expect(result.current.trialError).toBeInstanceOf(ApiError);
  });

  it("dismissTrialError limpa estado e reseta mutation", async () => {
    trialMutateAsync.mockRejectedValueOnce(new ApiError({ message: "x", status: 500 }));
    const { result } = renderHook(() => useSubscriptionScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleStartTrial();
    });
    act(() => {
      result.current.dismissTrialError();
    });

    expect(result.current.trialError).toBeNull();
    expect(trialReset).toHaveBeenCalled();
  });

  it("constrói comando de checkout sem billingCycle quando plan e cycle null", async () => {
    const { result } = renderHook(() => useSubscriptionScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleSubscribe(buildPlan({ billingCycle: null }));
    });

    expect(checkoutStart).toHaveBeenCalledWith({ planSlug: "premium-monthly" });
  });
});
