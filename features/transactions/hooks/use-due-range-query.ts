import { useQuery } from "@tanstack/react-query";

import type { DueRangeFilters, DueRangeResponse } from "@/features/transactions/contracts";
import { dueRangeService } from "@/features/transactions/services/due-range-service";

const dueRangeKey = (filters: DueRangeFilters): readonly unknown[] => {
  return ["transactions", "due-range", filters] as const;
};

/**
 * GET /transactions/due-range — list of pending transactions ordered
 * by overdue first within a configurable window. Defaults align with
 * the dashboard "next 7 days" card.
 *
 * @param filters Optional date range / ordering / pagination.
 */
export const useDueRangeQuery = (filters: DueRangeFilters = {}) => {
  return useQuery<DueRangeResponse>({
    queryKey: dueRangeKey(filters),
    queryFn: () => dueRangeService.list(filters),
    staleTime: 60_000,
  });
};
