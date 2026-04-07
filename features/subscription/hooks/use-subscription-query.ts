import { createApiQuery } from "@/core/query/create-api-query";
import type { SubscriptionState } from "@/features/subscription/contracts";
import { subscriptionService } from "@/features/subscription/services/subscription-service";

export const useSubscriptionStateQuery = () => {
  return createApiQuery<SubscriptionState>(
    ["subscription", "me"],
    () => subscriptionService.getSubscription(),
  );
};
