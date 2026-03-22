import { useMutation, useQueryClient } from "@tanstack/react-query";

import { alertsApi, type UpdatePreferencePayload } from "@/lib/alerts-api";
import type { AlertPreference } from "@/types/contracts";

interface UpdatePreferenceVariables {
  readonly category: string;
  readonly payload: UpdatePreferencePayload;
}

export const useUpdatePreferenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<AlertPreference, Error, UpdatePreferenceVariables>({
    mutationFn: ({ category, payload }) =>
      alertsApi.updatePreference(category, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alerts", "preferences"] });
    },
  });
};
