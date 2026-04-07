import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { SubscriptionState } from "@/features/subscription/contracts";
import { subscriptionService } from "@/features/subscription/services/subscription-service";

export const useSubscriptionStateQuery = () => {
  return createApiQuery<SubscriptionState>(
    queryKeys.subscription.me(),
    () => subscriptionService.getSubscription(),
  );
};
