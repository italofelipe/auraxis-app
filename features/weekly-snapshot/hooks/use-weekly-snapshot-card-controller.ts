import { useCallback, useEffect, useState } from "react";

import { useFeatureAccess } from "@/features/entitlements/hooks/use-feature-access";
import type { WeeklySnapshot } from "@/features/weekly-snapshot/contracts";
import { useWeeklySnapshotQuery } from "@/features/weekly-snapshot/hooks/use-weekly-snapshot-query";
import {
  buildSnapshotSignature,
  isSnapshotUnseen,
} from "@/features/weekly-snapshot/services/weekly-snapshot-service";
import {
  loadLastSeenSignature,
  persistLastSeenSignature,
} from "@/features/weekly-snapshot/services/weekly-snapshot-seen-storage";

/** Premium entitlement that unlocks the weekly-summary narrative. */
const WEEKLY_SNAPSHOT_ENTITLEMENT = "advanced_simulations" as const;

export interface WeeklySnapshotCardController {
  readonly hasAccess: boolean;
  readonly isLoading: boolean;
  readonly snapshot: WeeklySnapshot | null;
  readonly query: ReturnType<typeof useWeeklySnapshotQuery>;
  readonly isNew: boolean;
  readonly markSeen: () => Promise<void>;
}

/**
 * Orchestrates the premium weekly-snapshot dashboard card: gates the query on
 * the `advanced_simulations` entitlement, hydrates the last-seen signature for
 * the "NOVO" badge, and persists it on `markSeen`. The card stays view-only.
 */
export function useWeeklySnapshotCardController(): WeeklySnapshotCardController {
  const access = useFeatureAccess(WEEKLY_SNAPSHOT_ENTITLEMENT);
  const query = useWeeklySnapshotQuery(access.hasAccess);
  const snapshot = query.data ?? null;
  const [lastSeenSignature, setLastSeenSignature] = useState<string | null>(null);
  const [seenHydrated, setSeenHydrated] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    void loadLastSeenSignature().then((signature) => {
      if (active) {
        setLastSeenSignature(signature);
        setSeenHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const markSeen = useCallback(async (): Promise<void> => {
    if (!snapshot) {
      return;
    }
    const signature = buildSnapshotSignature(snapshot);
    await persistLastSeenSignature(signature);
    setLastSeenSignature(signature);
  }, [snapshot]);

  const isNew =
    seenHydrated && snapshot !== null && isSnapshotUnseen(snapshot, lastSeenSignature);

  return {
    hasAccess: access.hasAccess,
    isLoading: access.isLoading || query.isLoading,
    snapshot,
    query,
    isNew,
    markSeen,
  };
}
