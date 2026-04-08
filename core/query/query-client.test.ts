import { createAppQueryClient } from "@/core/query/query-client";
import { resolveRetryDelay, shouldRetryQuery } from "@/core/query/retry-policy";

describe("queryClient factory", () => {
  it("cria o client de runtime com a policy operacional canônica", () => {
    const queryClient = createAppQueryClient();
    const defaults = queryClient.getDefaultOptions();

    expect(defaults.queries).toMatchObject({
      staleTime: 30_000,
      gcTime: 300_000,
      retry: shouldRetryQuery,
      retryDelay: resolveRetryDelay,
      refetchOnWindowFocus: false,
    });
    expect(defaults.mutations).toMatchObject({
      retry: 0,
    });
  });

  it("cria o client de teste sem retry e sem timers de garbage collection", () => {
    const queryClient = createAppQueryClient({
      mode: "test",
    });
    const defaults = queryClient.getDefaultOptions();

    expect(defaults.queries).toMatchObject({
      staleTime: 0,
      gcTime: Number.POSITIVE_INFINITY,
      retry: false,
      retryDelay: 0,
      refetchOnWindowFocus: false,
    });
    expect(defaults.mutations).toMatchObject({
      retry: 0,
    });
  });
});
