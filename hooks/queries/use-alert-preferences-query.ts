import { useQuery } from "@tanstack/react-query";

import { alertsApi } from "@/lib/alerts-api";
import type { AlertPreference } from "@/types/contracts";

export const useAlertPreferencesQuery = () => {
  return useQuery<AlertPreference[]>({
    queryKey: ["alerts", "preferences"],
    queryFn: async (): Promise<AlertPreference[]> => {
      return await alertsApi.getPreferences();
    },
  });
};
