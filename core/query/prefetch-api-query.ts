import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type { ApiError } from "@/core/http/api-error";
import { resolveQueryPolicy } from "@/core/query/query-policy";

export interface PrefetchApiQueryOptions {
  readonly enabled?: boolean;
  readonly staleTime?: number;
  readonly gcTime?: number;
}

/**
 * Prefetches a query using the canonical cache policy.
 */
export const prefetchApiQuery = async <TData>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: PrefetchApiQueryOptions = {},
): Promise<void> => {
  if (options.enabled === false) {
    return;
  }

  const policy = resolveQueryPolicy(queryKey);
  const staleTime = options.staleTime ?? policy.staleTime;
  const gcTime = options.gcTime ?? policy.gcTime;

  await queryClient.prefetchQuery<TData, ApiError>({
    queryKey,
    queryFn,
    staleTime,
    gcTime,
  });
};
