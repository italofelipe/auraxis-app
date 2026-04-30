import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { simulationsService } from "@/features/tools/services/simulations-service";
import type {
  SaveSimulationCommand,
  SimulationRecord,
} from "@/features/tools/contracts";

/**
 * Generic mutation that persists a simulation through the canonical
 * `POST /simulations` endpoint (DEC-196). Invalidates the cross-tool
 * simulations cache on success so the history screen refreshes.
 * @returns React Query mutation handle.
 */
export const useSaveSimulationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<SimulationRecord, Error, SaveSimulationCommand>({
    mutationFn: simulationsService.saveSimulation,
    onSuccess: async (record): Promise<void> => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.simulations.root,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tools.simulationHistory(record.toolId),
      });
    },
  });
};
