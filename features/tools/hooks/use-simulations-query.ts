import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  DeleteSimulationCommand,
  SimulationListQuery,
  SimulationListResponse,
} from "@/features/tools/contracts";
import { simulationsService } from "@/features/tools/services/simulations-service";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 30;

export const useSimulationsListQuery = (
  query: SimulationListQuery = {},
) => {
  const page = query.page ?? DEFAULT_PAGE;
  const perPage = query.perPage ?? DEFAULT_PER_PAGE;
  return createApiQuery<SimulationListResponse>(
    queryKeys.simulations.list(page, perPage),
    () => simulationsService.listSimulations({ page, perPage }),
  );
};

export const useDeleteSimulationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, DeleteSimulationCommand>({
    mutationFn: (command) => simulationsService.deleteSimulation(command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.simulations.root,
      });
    },
  });
};
