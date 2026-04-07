import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { subscriptionService } from "@/features/subscription/services/subscription-service";
import type { Subscription } from "@/types/contracts";

export const useSubscriptionQuery = () => {
  return useQuery<Subscription>({
    queryKey: queryKeys.subscription.me(),
    queryFn: async (): Promise<Subscription> => {
      const subscription = await subscriptionService.getSubscription();

      return {
        plan_slug: subscription.offerCode ?? subscription.planCode,
        status:
          subscription.status === "expired" || subscription.status === "free"
            ? "canceled"
            : subscription.status,
        trial_ends_at: subscription.trialEndsAt,
        current_period_end: subscription.currentPeriodEnd,
      };
    },
  });
};
