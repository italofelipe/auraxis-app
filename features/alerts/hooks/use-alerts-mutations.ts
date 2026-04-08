import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import type { AlertPreferenceRecord } from "@/features/alerts/contracts";
import { alertsService } from "@/features/alerts/services/alerts-service";

export interface UpdateAlertPreferenceVariables {
  readonly category: string;
  readonly payload: {
    readonly enabled: boolean;
    readonly channels: string[];
    readonly globalOptOut: boolean;
  };
}

export const useMarkAlertReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => alertsService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.root });
    },
  });
};

export const useDeleteAlertMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => alertsService.deleteAlert(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.root });
    },
  });
};

export const useUpdateAlertPreferenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<AlertPreferenceRecord, Error, UpdateAlertPreferenceVariables>({
    mutationFn: async ({ category, payload }) => {
      return alertsService.updatePreference(category, {
        enabled: payload.enabled,
        channels: payload.channels,
        globalOptOut: payload.globalOptOut,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.alerts.preferences(),
      });
    },
  });
};
