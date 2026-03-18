import { useQuery } from "@tanstack/react-query";

import { alertsApi } from "@/lib/alerts-api";
import type { AlertsResponse } from "@/types/contracts";

export const useAlertsQuery = () => {
  return useQuery<AlertsResponse>({
    queryKey: ["alerts"],
    queryFn: async (): Promise<AlertsResponse> => {
      return await alertsApi.getAlerts();
    },
  });
};
