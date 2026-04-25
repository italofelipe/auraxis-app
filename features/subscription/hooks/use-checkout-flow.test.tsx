import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ApiError } from "@/core/http/api-error";
import type { CheckoutSession } from "@/features/subscription/contracts";
import { useCheckoutFlow } from "@/features/subscription/hooks/use-checkout-flow";
import { useCreateCheckoutMutation } from "@/features/subscription/hooks/use-subscription-mutations";

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

describe("useCheckoutFlow", () => {
  let mutateAsync: jest.Mock;
  let reset: jest.Mock;
  let openCheckout: jest.Mock;
  let client: QueryClient;

  beforeEach(() => {
    mutateAsync = jest.fn().mockResolvedValue(buildSession());
    reset = jest.fn();
    openCheckout = jest.fn().mockResolvedValue({ type: "success", returnUrl: "x://" });
    mockedUseCreate.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      error: null,
    } as never);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("invalida subscription e entitlements em sucesso e retorna completed", async () => {
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

  it("registra erro quando o session nao tem checkoutUrl", async () => {
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
