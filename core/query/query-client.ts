import { QueryClient } from "@tanstack/react-query";

import { resolveRetryDelay, shouldRetryQuery } from "@/core/query/retry-policy";

type AppQueryClientMode = "runtime" | "test";

interface CreateAppQueryClientOptions {
  readonly mode?: AppQueryClientMode;
}

const RUNTIME_STALE_TIME_MS = 30_000;
const RUNTIME_GC_TIME_MS = 300_000;

const buildDefaultOptions = (mode: AppQueryClientMode) => {
  if (mode === "test") {
    return {
      queries: {
        staleTime: 0,
        gcTime: Number.POSITIVE_INFINITY,
        retry: false,
        retryDelay: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    } as const;
  }

  return {
    queries: {
      staleTime: RUNTIME_STALE_TIME_MS,
      gcTime: RUNTIME_GC_TIME_MS,
      retry: shouldRetryQuery,
      retryDelay: resolveRetryDelay,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  } as const;
};

export const createAppQueryClient = (
  options: CreateAppQueryClientOptions = {},
): QueryClient => {
  return new QueryClient({
    defaultOptions: buildDefaultOptions(options.mode ?? "runtime"),
  });
};

export const queryClient = createAppQueryClient();
