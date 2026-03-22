import { useMutation, useQueryClient } from "@tanstack/react-query";

import { alertsApi } from "@/lib/alerts-api";

export const useMarkReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => alertsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};
