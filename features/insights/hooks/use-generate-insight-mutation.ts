import { useQueryClient } from "@tanstack/react-query";

import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  GeneratedInsightResponse,
  GenerateInsightCommand,
  InsightHistoryResponse,
} from "@/features/insights/contracts";
import { insightService } from "@/features/insights/services/insight-service";

const DEFAULT_COMMAND: GenerateInsightCommand = {
  periodType: "daily",
};

const prependGeneratedInsight = (
  previous: InsightHistoryResponse | undefined,
  generated: GeneratedInsightResponse,
): InsightHistoryResponse | undefined => {
  if (!previous) {
    return previous;
  }

  const withoutDuplicate = previous.items.filter(
    (item) => item.id !== generated.insight.id,
  );

  return {
    ...previous,
    items: [generated.insight, ...withoutDuplicate],
    total: Math.max(previous.total, withoutDuplicate.length + 1),
  };
};

export const useGenerateInsightMutation = () => {
  const queryClient = useQueryClient();

  return createApiMutation<
    GeneratedInsightResponse,
    GenerateInsightCommand | undefined
  >(
    (command) => insightService.generate(command ?? DEFAULT_COMMAND),
    {
      onSuccess: async (generated) => {
        queryClient.setQueryData(queryKeys.insights.current(), generated.insight);
        queryClient.setQueryData<InsightHistoryResponse>(
          queryKeys.insights.history(1, 20),
          (previous) => prependGeneratedInsight(previous, generated),
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.insights.historyRoot() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.insights.latest() }),
        ]);
      },
    },
  );
};
