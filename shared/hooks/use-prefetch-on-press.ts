import { useCallback } from "react";

import { type QueryFunction, type QueryKey, useQueryClient } from "@tanstack/react-query";

export interface PrefetchOnPressOptions<TData> {
  readonly queryKey: QueryKey;
  readonly queryFn: QueryFunction<TData>;
  /**
   * Stale time for the prefetched payload. Defaults to 30 seconds so a
   * typical detail screen open within that window reuses the cache.
   */
  readonly staleTime?: number;
}

const DEFAULT_PREFETCH_STALE_MS = 30_000;

/**
 * Returns a stable handler that warms the query cache for a detail
 * screen as soon as the user touches a list row.
 *
 * Usage pattern: bind it to a row's `onPressIn`. While the user's
 * finger is still on the screen, React Query starts the request, so
 * by the time the navigation push lands the data is hot.
 *
 * @param options Query identity + fetcher + optional staleTime.
 * @returns A no-arg callback safe to bind to `onPressIn` or `onHover`.
 */
export const usePrefetchOnPress = <TData>(
  options: PrefetchOnPressOptions<TData>,
): (() => void) => {
  const queryClient = useQueryClient();
  const { queryKey, queryFn, staleTime = DEFAULT_PREFETCH_STALE_MS } = options;

  return useCallback((): void => {
    void queryClient.prefetchQuery({ queryKey, queryFn, staleTime });
  }, [queryClient, queryFn, queryKey, staleTime]);
};
