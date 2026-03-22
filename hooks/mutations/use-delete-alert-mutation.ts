import { useMutation, useQueryClient } from "@tanstack/react-query";

import { alertsApi } from "@/lib/alerts-api";

export const useDeleteAlertMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => alertsApi.deleteAlert(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};
