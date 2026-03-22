import { useQuery } from "@tanstack/react-query";

import { installmentVsCashApi } from "@/lib/installment-vs-cash-api";
import { INSTALLMENT_VS_CASH_TOOL_ID } from "@/shared/validators/installment-vs-cash";
import type { InstallmentVsCashSavedSimulation } from "@/types/contracts/installment-vs-cash";

export const useInstallmentVsCashHistoryQuery = (
  enabled = true,
) => {
  return useQuery<readonly InstallmentVsCashSavedSimulation[]>({
    queryKey: ["simulations", INSTALLMENT_VS_CASH_TOOL_ID],
    enabled,
    queryFn: async (): Promise<readonly InstallmentVsCashSavedSimulation[]> => {
      const items = await installmentVsCashApi.listSaved(1, 10);
      return items.filter((item) => item.toolId === INSTALLMENT_VS_CASH_TOOL_ID);
    },
  });
};
