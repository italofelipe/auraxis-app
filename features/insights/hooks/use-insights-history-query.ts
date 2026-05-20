import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  InsightHistoryQuery,
  InsightHistoryResponse,
} from "@/features/insights/contracts";
import { insightService } from "@/features/insights/services/insight-service";

export const useInsightsHistoryQuery = (
  query: InsightHistoryQuery = {},
) => {
  const page = query.page ?? 1;
  const perPage = query.perPage ?? 20;

  return createApiQuery<InsightHistoryResponse>(
    queryKeys.insights.history(page, perPage),
    () => insightService.history({ page, perPage }),
  );
};
