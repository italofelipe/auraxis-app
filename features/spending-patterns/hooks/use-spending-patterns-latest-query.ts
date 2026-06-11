import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { SpendingPatternsLatest } from "@/features/spending-patterns/contracts";
import { spendingPatternsService } from "@/features/spending-patterns/services/spending-patterns-service";

/**
 * Reads the latest cron-generated spending-patterns radar. Read-only — never
 * calls the LLM and never consumes the AI daily quota (mirrors web parity).
 */
export const useSpendingPatternsLatestQuery = () => {
  return createApiQuery<SpendingPatternsLatest>(
    queryKeys.spendingPatterns.latest(),
    () => spendingPatternsService.getLatest(),
  );
};
