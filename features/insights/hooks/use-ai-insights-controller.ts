import { useCallback, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/core/http/api-error";
import { queryKeys } from "@/core/query/query-keys";
import type {
  GenerateInsightCommand,
  InsightDimension,
  InsightHistoryResponse,
  InsightItem,
  UserInsight,
} from "@/features/insights/contracts";
import { useGenerateInsightMutation } from "@/features/insights/hooks/use-generate-insight-mutation";
import { useInsightsHistoryQuery } from "@/features/insights/hooks/use-insights-history-query";
import {
  filterInsightItemsByDimension,
  groupInsightItemsByDimension,
  type InsightDimensionGroup,
} from "@/features/insights/hooks/use-insights-by-dimension";

export interface AiInsightsControllerOptions {
  readonly dimension?: InsightDimension;
  readonly page?: number;
  readonly perPage?: number;
}

export interface AiInsightsController {
  readonly currentInsight: UserInsight | null;
  readonly visibleItems: readonly InsightItem[];
  readonly dimensionGroups: readonly InsightDimensionGroup[];
  readonly history: readonly UserInsight[];
  readonly historyQuery: ReturnType<typeof useInsightsHistoryQuery>;
  readonly isGenerating: boolean;
  readonly generateError: ApiError | null;
  readonly generateErrorTitle: string | null;
  readonly callsRemaining: number | null;
  readonly hasGeneratedInsight: boolean;
  readonly shouldShowContextualEmptyState: boolean;
  readonly generate: (command?: GenerateInsightCommand) => Promise<void>;
  readonly dismissGenerateError: () => void;
}

const DEFAULT_HISTORY: InsightHistoryResponse = {
  items: [],
  page: 1,
  perPage: 20,
  total: 0,
};

const isQuotaError = (error: ApiError | null): boolean => {
  return error?.status === 429;
};

const useCurrentInsightQuery = () => {
  return useQuery<UserInsight | null>({
    queryKey: queryKeys.insights.current(),
    queryFn: async () => null,
    enabled: false,
    initialData: null,
  });
};

const resolveVisibleItems = (
  items: readonly InsightItem[],
  dimension: InsightDimension | undefined,
): readonly InsightItem[] => {
  return dimension ? filterInsightItemsByDimension(items, dimension) : items;
};

export const useAiInsightsController = (
  options: AiInsightsControllerOptions = {},
): AiInsightsController => {
  const historyQuery = useInsightsHistoryQuery({
    page: options.page ?? 1,
    perPage: options.perPage ?? 20,
  });
  const currentQuery = useCurrentInsightQuery();
  const generateMutation = useGenerateInsightMutation();
  const historyData = historyQuery.data ?? DEFAULT_HISTORY;
  const currentInsight = currentQuery.data ?? historyData.items[0] ?? null;
  const allItems = currentInsight?.items ?? [];
  const visibleItems = useMemo(
    () => resolveVisibleItems(allItems, options.dimension),
    [allItems, options.dimension],
  );
  const dimensionGroups = useMemo(
    () => groupInsightItemsByDimension(allItems),
    [allItems],
  );
  const generateError = generateMutation.error ?? null;

  const generate = useCallback(
    async (command?: GenerateInsightCommand): Promise<void> => {
      try {
        await generateMutation.mutateAsync(command);
      } catch {
        // The mutation error is exposed via generateError for inline feedback.
      }
    },
    [generateMutation],
  );

  return {
    currentInsight,
    visibleItems,
    dimensionGroups,
    history: historyData.items,
    historyQuery,
    isGenerating: generateMutation.isPending,
    generateError,
    generateErrorTitle: isQuotaError(generateError)
      ? "Voce atingiu o limite de 2 insights/dia"
      : null,
    callsRemaining: generateMutation.data?.callsRemaining ?? null,
    hasGeneratedInsight: allItems.length > 0,
    shouldShowContextualEmptyState: Boolean(
      options.dimension && allItems.length > 0 && visibleItems.length === 0,
    ),
    generate,
    dismissGenerateError: generateMutation.reset,
  };
};
