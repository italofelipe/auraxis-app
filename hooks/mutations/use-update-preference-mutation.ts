import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { alertsService } from "@/features/alerts/services/alerts-service";
import type { AlertPreference } from "@/types/contracts";

interface UpdatePreferenceVariables {
  readonly category: string;
  readonly payload: {
    readonly enabled: boolean;
    readonly channels: string[];
  };
}

export const useUpdatePreferenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<AlertPreference, Error, UpdatePreferenceVariables>({
    mutationFn: ({ category, payload }) =>
      alertsService.updatePreference(category, {
        enabled: payload.enabled,
        channels: payload.channels,
        globalOptOut: false,
      }).then((preference) => ({
        id: preference.id,
        category: preference.category,
        enabled: preference.enabled,
        channels: payload.channels,
      })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.alerts.preferences(),
      });
    },
  });
};
