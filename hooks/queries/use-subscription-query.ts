import { useQuery } from "@tanstack/react-query";

import { subscriptionApi } from "@/lib/subscription-api";
import type { Subscription } from "@/types/contracts";

export const useSubscriptionQuery = () => {
  return useQuery<Subscription>({
    queryKey: ["subscription", "me"],
    queryFn: async (): Promise<Subscription> => {
      return subscriptionApi.getMySubscription();
    },
  });
};
