import { useRouter } from "expo-router";
import { useState } from "react";

import type { SimulationRecord } from "@/features/tools/contracts";
import {
  useDeleteSimulationMutation,
  useSimulationsListQuery,
} from "@/features/tools/hooks/use-simulations-query";

export interface SimulationsHistoryScreenController {
  readonly query: ReturnType<typeof useSimulationsListQuery>;
  readonly items: readonly SimulationRecord[];
  readonly deletingId: string | null;
  readonly isRefreshing: boolean;
  readonly handleRefresh: () => Promise<void>;
  readonly handleDelete: (simulation: SimulationRecord) => Promise<void>;
  readonly handleBack: () => void;
}

/**
 * Owns the simulations history list state: refresh, delete with optimistic
 * busy-state per row, navigation back.
 */
export function useSimulationsHistoryScreenController(): SimulationsHistoryScreenController {
  const router = useRouter();
  const query = useSimulationsListQuery();
  const deleteMutation = useDeleteSimulationMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (simulation: SimulationRecord): Promise<void> => {
    setDeletingId(simulation.id);
    try {
      await deleteMutation.mutateAsync({ simulationId: simulation.id });
    } finally {
      setDeletingId(null);
    }
  };

  return {
    query,
    items: query.data?.items ?? [],
    deletingId,
    isRefreshing: query.isFetching && !query.isLoading,
    handleRefresh: async () => {
      await query.refetch();
    },
    handleDelete,
    handleBack: () => router.back(),
  };
}
