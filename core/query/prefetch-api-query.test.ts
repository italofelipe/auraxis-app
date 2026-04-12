import type { QueryClient } from "@tanstack/react-query";

import { prefetchApiQuery } from "@/core/query/prefetch-api-query";

const createQueryClientMock = () => {
  return {
    prefetchQuery: jest.fn().mockResolvedValue(undefined),
  } as unknown as QueryClient;
};

describe("prefetchApiQuery", () => {
  it("prefetches using policy defaults when enabled", async () => {
    const queryClient = createQueryClientMock();
    const queryFn = jest.fn().mockResolvedValue("ok");

    await prefetchApiQuery(queryClient, ["dashboard", "overview"], {
      queryFn,
    });

    expect(queryClient.prefetchQuery).toHaveBeenCalledWith({
      queryKey: ["dashboard", "overview"],
      queryFn,
      staleTime: 30_000,
      gcTime: 300_000,
    });
  });

  it("respects explicit overrides", async () => {
    const queryClient = createQueryClientMock();
    const queryFn = jest.fn().mockResolvedValue("ok");

    await prefetchApiQuery(queryClient, ["observability", "snapshot"], {
      queryFn,
      staleTime: 5_000,
      gcTime: 60_000,
    });

    expect(queryClient.prefetchQuery).toHaveBeenCalledWith({
      queryKey: ["observability", "snapshot"],
      queryFn,
      staleTime: 5_000,
      gcTime: 60_000,
    });
  });

  it("skips prefetch when disabled", async () => {
    const queryClient = createQueryClientMock();
    const queryFn = jest.fn().mockResolvedValue("ok");

    await prefetchApiQuery(queryClient, ["dashboard", "overview"], {
      queryFn,
      enabled: false,
    });

    expect(queryClient.prefetchQuery).not.toHaveBeenCalled();
  });
});
