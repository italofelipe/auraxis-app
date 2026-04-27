import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import * as React from "react";

import { usePrefetchOnPress } from "@/shared/hooks/use-prefetch-on-press";

const buildWrapper = (client: QueryClient) =>
  function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };

describe("usePrefetchOnPress", () => {
  it("dispara prefetchQuery com a key fornecida", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const prefetchSpy = jest.spyOn(client, "prefetchQuery");
    const queryFn = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(
      () =>
        usePrefetchOnPress({
          queryKey: ["transactions", "detail", "tx-1"],
          queryFn,
        }),
      { wrapper: buildWrapper(client) },
    );

    await act(async () => {
      result.current();
      await Promise.resolve();
    });

    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    expect(prefetchSpy.mock.calls[0]?.[0].queryKey).toEqual([
      "transactions",
      "detail",
      "tx-1",
    ]);
  });

  it("retorna a mesma referência para a mesma key", () => {
    const client = new QueryClient();
    const queryFn = jest.fn().mockResolvedValue({ ok: true });
    const queryKey = ["wallet", "operations", "1"] as const;

    const { result, rerender } = renderHook(
      () => usePrefetchOnPress({ queryKey, queryFn }),
      { wrapper: buildWrapper(client) },
    );

    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });
});
