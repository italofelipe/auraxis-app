import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { WeeklySnapshot } from "@/features/weekly-snapshot/contracts";
import { weeklySnapshotService } from "@/features/weekly-snapshot/services/weekly-snapshot-service";

/**
 * Reads the premium weekly-summary narrative. `enabled` MUST be bound to the
 * `advanced_simulations` entitlement so free users never trigger a 403 churn.
 */
export const useWeeklySnapshotQuery = (enabled: boolean) => {
  return createApiQuery<WeeklySnapshot>(
    queryKeys.weeklySnapshot.current(),
    () => weeklySnapshotService.getWeeklySnapshot(),
    { enabled },
  );
};
