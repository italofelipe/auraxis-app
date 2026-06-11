import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  WeeklySnapshot,
  WeeklySummaryNarrativeResponse,
} from "@/features/weekly-snapshot/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

const mapWeeklySnapshot = (
  payload: WeeklySummaryNarrativeResponse,
): WeeklySnapshot => {
  const current = payload.summary.current_week;
  const comparison = payload.summary.comparison;
  return {
    narrative: payload.narrative,
    weekStart: current.start,
    weekEnd: current.end,
    currentIncome: current.income,
    currentExpense: current.expense,
    currentBalance: current.balance,
    transactionCount: current.transaction_count,
    expenseDeltaPercent: comparison.expense_delta_percent,
    balanceDeltaPercent: comparison.balance_delta_percent,
  };
};

/**
 * Builds a stable signature for change detection: two snapshots with the same
 * week bounds and current-week expense produce the same signature.
 */
export const buildSnapshotSignature = (snapshot: WeeklySnapshot): string =>
  `${snapshot.weekStart}_${snapshot.weekEnd}_${snapshot.currentExpense}`;

/**
 * Decides whether the snapshot is new relative to the last seen signature.
 */
export const isSnapshotUnseen = (
  snapshot: WeeklySnapshot,
  lastSeenSignature: string | null,
): boolean => buildSnapshotSignature(snapshot) !== lastSeenSignature;

/**
 * HTTP adapter for the premium weekly-summary narrative endpoint. The query
 * is gated on the `advanced_simulations` entitlement upstream so free users
 * never reach this call.
 */
export const createWeeklySnapshotService = (client: AxiosInstance) => {
  return {
    getWeeklySnapshot: async (): Promise<WeeklySnapshot> => {
      const response = await client.get(apiContractMap.weeklySummary.path);
      const payload = unwrapEnvelopeData<WeeklySummaryNarrativeResponse>(
        response.data,
      );
      return mapWeeklySnapshot(payload);
    },
  };
};

export const weeklySnapshotService = createWeeklySnapshotService(httpClient);
