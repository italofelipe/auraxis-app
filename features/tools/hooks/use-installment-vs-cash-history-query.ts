import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { installmentVsCashService } from "@/features/tools/services/installment-vs-cash-service";
import { INSTALLMENT_VS_CASH_TOOL_ID } from "@/shared/validators/installment-vs-cash";
import type { InstallmentVsCashSavedSimulation } from "@/features/tools/contracts";

/**
 * Loads the recent saved installment-vs-cash simulations.
 *
 * @param enabled Allows callers to disable the query when the user is not authenticated.
 * @returns Query result with the recent saved simulations for the tool.
 */
export const useInstallmentVsCashHistoryQuery = (
  enabled = true,
) => {
  return useQuery<readonly InstallmentVsCashSavedSimulation[]>({
    queryKey: queryKeys.tools.simulationHistory(INSTALLMENT_VS_CASH_TOOL_ID),
    enabled,
    queryFn: async (): Promise<readonly InstallmentVsCashSavedSimulation[]> => {
      const items = await installmentVsCashService.listSaved(1, 10);
      return items.filter((item) => item.toolId === INSTALLMENT_VS_CASH_TOOL_ID);
    },
  });
};
