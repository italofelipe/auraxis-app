import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { UserInsight } from "@/features/insights/contracts";
import { insightService } from "@/features/insights/services/insight-service";

const markInsightRead = (insight: UserInsight, readAt: string): UserInsight => ({
  ...insight,
  status: "read",
  readAt,
});

export interface WeeklyInsightState {
  readonly insight: UserInsight | null;
  readonly isLoading: boolean;
  readonly isNew: boolean;
  readonly fetchLatest: () => Promise<unknown>;
  readonly markAsRead: (insightId: string) => Promise<void>;
  readonly query: ReturnType<typeof createApiQuery<UserInsight | null>>;
}

export const useWeeklyInsight = (
  options: { readonly enabled?: boolean } = {},
): WeeklyInsightState => {
  const enabled = options.enabled ?? true;
  const queryClient = useQueryClient();
  const query = createApiQuery<UserInsight | null>(
    queryKeys.insights.latest(),
    () => insightService.getLatest(),
    { enabled },
  );
  const mutation = useMutation<
    void,
    Error,
    string,
    { readonly previous: UserInsight | null | undefined }
  >({
    mutationFn: (insightId) => insightService.markAsRead(insightId),
    onMutate: async (insightId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.insights.latest() });
      const previous = queryClient.getQueryData<UserInsight | null>(
        queryKeys.insights.latest(),
      );
      const readAt = new Date().toISOString();
      if (previous?.id === insightId) {
        queryClient.setQueryData<UserInsight | null>(
          queryKeys.insights.latest(),
          markInsightRead(previous, readAt),
        );
      }
      return { previous };
    },
    onError: (_error, _insightId, context) => {
      const previous = context?.previous;
      if (previous !== undefined) {
        queryClient.setQueryData<UserInsight | null>(
          queryKeys.insights.latest(),
          previous,
        );
      }
    },
  });

  return {
    insight: query.data ?? null,
    isLoading: query.isPending || query.isLoading,
    isNew: Boolean(query.data && query.data.status !== "read"),
    fetchLatest: query.refetch,
    markAsRead: async (insightId: string): Promise<void> => {
      await mutation.mutateAsync(insightId);
    },
    query,
  };
};
