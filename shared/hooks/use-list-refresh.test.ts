import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import * as React from "react";

import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { useListRefresh } from "@/shared/hooks/use-list-refresh";

jest.mock("@/shared/feedback/haptics", () => ({
  triggerHapticImpact: jest.fn(),
}));

const triggerHapticImpactMock = triggerHapticImpact as jest.MockedFunction<
  typeof triggerHapticImpact
>;

const buildWrapper = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
};

describe("useListRefresh", () => {
  beforeEach(() => {
    triggerHapticImpactMock.mockClear();
  });

  it("invalida query keys e gerencia estado refreshing", async () => {
    const { result } = renderHook(
      () => useListRefresh([["transactions", "list"]]),
      { wrapper: buildWrapper() },
    );

    expect(result.current.refreshing).toBe(false);

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(triggerHapticImpactMock).toHaveBeenCalledWith("light");
    expect(result.current.refreshing).toBe(false);
  });

  it("aceita varias query keys", async () => {
    const { result } = renderHook(
      () =>
        useListRefresh([
          ["transactions", "list"],
          ["dashboard", "overview"],
        ]),
      { wrapper: buildWrapper() },
    );

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(triggerHapticImpactMock).toHaveBeenCalledTimes(1);
  });
});
