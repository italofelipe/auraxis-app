import { QueryClient } from "@tanstack/react-query";

import { resolveRetryDelay, shouldRetryQuery } from "@/core/query/retry-policy";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      retry: shouldRetryQuery,
      retryDelay: resolveRetryDelay,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
