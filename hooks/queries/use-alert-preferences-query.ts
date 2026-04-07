import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { alertsService } from "@/features/alerts/services/alerts-service";
import type { AlertPreference } from "@/types/contracts";

const DEFAULT_ALERT_CHANNELS = ["email"] as const;

export const useAlertPreferencesQuery = () => {
  return useQuery<AlertPreference[]>({
    queryKey: queryKeys.alerts.preferences(),
    queryFn: async (): Promise<AlertPreference[]> => {
      const response = await alertsService.getPreferences();

      return response.preferences.map((preference) => ({
        id: preference.id,
        category: preference.category,
        enabled: preference.enabled,
        channels: [...DEFAULT_ALERT_CHANNELS],
      }));
    },
  });
};
