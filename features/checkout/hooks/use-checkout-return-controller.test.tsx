import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren, ReactElement } from "react";

import { queryKeys } from "@/core/query/query-keys";
import { useCheckoutReturnController } from "@/features/checkout/hooks/use-checkout-return-controller";

const mockReplace = jest.fn();
let mockedSearchParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => mockedSearchParams,
}));

const buildWrapper = (
  client: QueryClient,
): ((props: PropsWithChildren) => ReactElement) =>
  function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

const buildClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

describe("useCheckoutReturnController", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockedSearchParams = {};
  });

  it("normalises raw status keys to canonical values", () => {
    mockedSearchParams = { status: "PAID" };
    const client = buildClient();
    const { result } = renderHook(
      () => useCheckoutReturnController("success"),
      { wrapper: buildWrapper(client) },
    );
    expect(result.current.query.status).toBe("success");
  });

  it("falls back to checkout_status query key", () => {
    mockedSearchParams = { checkout_status: "cancelled" };
    const client = buildClient();
    const { result } = renderHook(
      () => useCheckoutReturnController("cancel"),
      { wrapper: buildWrapper(client) },
    );
    expect(result.current.query.status).toBe("cancel");
  });

  it("returns 'unknown' when no status is provided", () => {
    const client = buildClient();
    const { result } = renderHook(
      () => useCheckoutReturnController("success"),
      { wrapper: buildWrapper(client) },
    );
    expect(result.current.query.status).toBe("unknown");
  });

  it("extracts provider, planSlug and externalReference", () => {
    mockedSearchParams = {
      status: "success",
      provider: "asaas",
      plan_slug: "premium-monthly",
      external_reference: "ref-123",
    };
    const client = buildClient();
    const { result } = renderHook(
      () => useCheckoutReturnController("success"),
      { wrapper: buildWrapper(client) },
    );
    expect(result.current.query.provider).toBe("asaas");
    expect(result.current.query.planSlug).toBe("premium-monthly");
    expect(result.current.query.externalReference).toBe("ref-123");
  });

  it("invalidates subscription cache on the success variant", () => {
    const client = buildClient();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    renderHook(() => useCheckoutReturnController("success"), {
      wrapper: buildWrapper(client),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.subscription.root,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.entitlements.root,
    });
  });

  it("does not invalidate when the cancel variant has no success/pending status", () => {
    mockedSearchParams = { status: "cancel" };
    const client = buildClient();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    renderHook(() => useCheckoutReturnController("cancel"), {
      wrapper: buildWrapper(client),
    });
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("invalidates when the cancel variant lands with a pending status (gateway delay)", () => {
    mockedSearchParams = { status: "pending" };
    const client = buildClient();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    renderHook(() => useCheckoutReturnController("cancel"), {
      wrapper: buildWrapper(client),
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it("handleViewSubscription replaces with /assinatura", () => {
    const client = buildClient();
    const { result } = renderHook(
      () => useCheckoutReturnController("success"),
      { wrapper: buildWrapper(client) },
    );
    act(() => {
      result.current.handleViewSubscription();
    });
    expect(mockReplace).toHaveBeenCalledWith("/assinatura");
  });

  it("handleGoToDashboard replaces with /dashboard", () => {
    const client = buildClient();
    const { result } = renderHook(
      () => useCheckoutReturnController("success"),
      { wrapper: buildWrapper(client) },
    );
    act(() => {
      result.current.handleGoToDashboard();
    });
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("handleRetry replaces with /assinatura", () => {
    const client = buildClient();
    const { result } = renderHook(
      () => useCheckoutReturnController("cancel"),
      { wrapper: buildWrapper(client) },
    );
    act(() => {
      result.current.handleRetry();
    });
    expect(mockReplace).toHaveBeenCalledWith("/assinatura");
  });
});
