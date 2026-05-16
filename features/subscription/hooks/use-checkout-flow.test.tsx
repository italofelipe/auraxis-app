import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ApiError } from "@/core/http/api-error";
import type { CheckoutSession } from "@/features/subscription/contracts";
import { useCheckoutFlow } from "@/features/subscription/hooks/use-checkout-flow";
import { useCreateCheckoutMutation } from "@/features/subscription/hooks/use-subscription-mutations";
import type { CheckoutProvider } from "@/features/subscription/services/checkout-provider-service";

jest.mock("@/features/subscription/hooks/use-subscription-mutations", () => ({
  useCreateCheckoutMutation: jest.fn(),
}));

const mockedUseCreate = jest.mocked(useCreateCheckoutMutation);

const buildSession = (
  override: Partial<CheckoutSession> = {},
): CheckoutSession => ({
  planSlug: "premium-monthly",
  planCode: "premium",
  billingCycle: "monthly",
  checkoutUrl: "https://checkout.example.com/abc",
  provider: "asaas",
  ...override,
});

const wrapper = (client: QueryClient) => {
  const Provider = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Provider.displayName = "TestQueryClientProvider";
  return Provider;
};

type CheckoutFlowTestState = {
  readonly mutateAsync: jest.Mock;
  readonly reset: jest.Mock;
  readonly openCheckout: jest.Mock;
  readonly client: QueryClient;
};

const setupCheckoutFlowTest = (): CheckoutFlowTestState => {
  jest.clearAllMocks();
  const mutateAsync = jest.fn().mockResolvedValue(buildSession());
  const reset = jest.fn();
  const openCheckout = jest
    .fn()
    .mockResolvedValue({ type: "success", returnUrl: "x://" });
  mockedUseCreate.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      error: null,
    } as never);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { mutateAsync, reset, openCheckout, client };
};

describe("useCheckoutFlow", () => {
  it("invalida subscription e entitlements em sucesso e retorna completed", async () => {
    const { client, mutateAsync, openCheckout } = setupCheckoutFlowTest();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(
      () =>
        useCheckoutFlow({
          checkoutService: { openCheckout, dismissCheckout: jest.fn() } as never,
        }),
      { wrapper: wrapper(client) },
    );

    const outcomeRef: { current: { outcome: string } | null } = { current: null };
    await act(async () => {
      outcomeRef.current = await result.current.start({ planSlug: "premium-monthly" });
    });
    const outcome = outcomeRef.current;

    expect(mutateAsync).toHaveBeenCalledWith({ planSlug: "premium-monthly" });
    expect(openCheckout).toHaveBeenCalled();
    expect(outcome?.outcome).toBe("completed");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["subscription"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["entitlements"] }),
    );
  });

  it("nao invalida estado quando o usuario cancelou", async () => {
    const { client, openCheckout } = setupCheckoutFlowTest();
    openCheckout.mockResolvedValueOnce({ type: "cancel", returnUrl: "x://" });
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useCheckoutFlow({
          checkoutService: { openCheckout, dismissCheckout: jest.fn() } as never,
        }),
      { wrapper: wrapper(client) },
    );

    const outcomeRef: { current: { outcome: string } | null } = { current: null };
    await act(async () => {
      outcomeRef.current = await result.current.start({ planSlug: "premium-monthly" });
    });
    const outcome = outcomeRef.current;

    expect(outcome?.outcome).toBe("canceled");
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("captura erro quando createCheckout falha e nao abre browser", async () => {
    const { client, mutateAsync, openCheckout } = setupCheckoutFlowTest();
    mutateAsync.mockRejectedValueOnce(
      new ApiError({ message: "checkout offline", status: 503 }),
    );

    const { result } = renderHook(
      () =>
        useCheckoutFlow({
          checkoutService: { openCheckout, dismissCheckout: jest.fn() } as never,
        }),
      { wrapper: wrapper(client) },
    );

    const outcomeRef: { current: { outcome: string } | null } = { current: null };
    await act(async () => {
      outcomeRef.current = await result.current.start({ planSlug: "premium-monthly" });
    });
    const outcome = outcomeRef.current;

    expect(outcome?.outcome).toBe("unavailable");
    expect(openCheckout).not.toHaveBeenCalled();
    expect(result.current.lastError).toBeInstanceOf(ApiError);
  });

  it("usa provider store sem criar checkout hospedado nem abrir browser externo", async () => {
    const { client, mutateAsync, openCheckout } = setupCheckoutFlowTest();
    const storeError = new ApiError({
      message: "Compras pela loja ainda nao configuradas.",
      status: 503,
      code: "STORE_CHECKOUT_UNCONFIGURED",
    });
    const storeProvider: CheckoutProvider = {
      kind: "store",
      requiresCheckoutSession: false,
      openCheckout: jest.fn().mockRejectedValue(storeError),
      dismissCheckout: jest.fn().mockResolvedValue(undefined),
    };

    const { result } = renderHook(
      () =>
        useCheckoutFlow({
          checkoutProvider: storeProvider,
        }),
      { wrapper: wrapper(client) },
    );

    const outcomeRef: { current: { outcome: string } | null } = { current: null };
    await act(async () => {
      outcomeRef.current = await result.current.start({ planSlug: "premium-monthly" });
    });
    const outcome = outcomeRef.current;

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(openCheckout).not.toHaveBeenCalled();
    expect(storeProvider.openCheckout).toHaveBeenCalledWith({
      command: { planSlug: "premium-monthly" },
      session: null,
    });
    expect(outcome?.outcome).toBe("unavailable");
    expect(result.current.lastError).toBe(storeError);
  });

  it("registra erro quando o session nao tem checkoutUrl", async () => {
    const { client, mutateAsync, openCheckout } = setupCheckoutFlowTest();
    mutateAsync.mockResolvedValueOnce(buildSession({ checkoutUrl: null }));

    const { result } = renderHook(
      () =>
        useCheckoutFlow({
          checkoutService: { openCheckout, dismissCheckout: jest.fn() } as never,
        }),
      { wrapper: wrapper(client) },
    );

    const outcomeRef: { current: { outcome: string } | null } = { current: null };
    await act(async () => {
      outcomeRef.current = await result.current.start({ planSlug: "premium-monthly" });
    });
    const outcome = outcomeRef.current;

    expect(outcome?.outcome).toBe("unavailable");
    expect(openCheckout).not.toHaveBeenCalled();
    expect(result.current.lastError).toBeInstanceOf(ApiError);
  });

  it("resetError limpa lastError e a mutation", async () => {
    const { client, mutateAsync, openCheckout, reset } = setupCheckoutFlowTest();
    mutateAsync.mockRejectedValueOnce(new ApiError({ message: "x", status: 500 }));
    const { result } = renderHook(
      () =>
        useCheckoutFlow({
          checkoutService: { openCheckout, dismissCheckout: jest.fn() } as never,
        }),
      { wrapper: wrapper(client) },
    );

    await act(async () => {
      await result.current.start({ planSlug: "premium-monthly" });
    });
    expect(result.current.lastError).not.toBeNull();

    act(() => {
      result.current.resetError();
    });

    expect(result.current.lastError).toBeNull();
    expect(reset).toHaveBeenCalled();
  });
});
