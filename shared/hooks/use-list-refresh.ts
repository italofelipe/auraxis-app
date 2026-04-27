import { useCallback, useState } from "react";

import { type QueryKey, useQueryClient } from "@tanstack/react-query";

import { triggerHapticImpact } from "@/shared/feedback/haptics";

export interface UseListRefreshResult {
  /** Whether a refresh is currently in flight. Bind to RefreshControl. */
  readonly refreshing: boolean;
  /** Handler to pass directly to RefreshControl `onRefresh`. */
  readonly onRefresh: () => Promise<void>;
}

/**
 * Standard pull-to-refresh adapter for list screens.
 *
 * Invalidates the supplied query keys, fires a light haptic at the
 * start of the gesture, and resolves once all invalidations finish so
 * native `RefreshControl` can hide its spinner.
 *
 * NOTE: this hook is the canonical entry point for all list refresh
 * gestures, but pull-to-refresh wiring on RN lists ships in tandem
 * with the FlashList migration (Epic #296). Today the hook is safe to
 * call from any `ScrollView` / `FlatList` and will be widened
 * automatically when those lists migrate.
 *
 * @param queryKeys One or many TanStack Query keys to invalidate.
 * @returns Refresh state and handler.
 */
export const useListRefresh = (
  queryKeys: readonly QueryKey[],
): UseListRefreshResult => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    triggerHapticImpact("light");
    try {
      await Promise.all(
        queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, queryKeys]);

  return { refreshing, onRefresh };
};
