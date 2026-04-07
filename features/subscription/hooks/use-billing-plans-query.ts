import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { BillingPlan } from "@/features/subscription/contracts";
import { subscriptionService } from "@/features/subscription/services/subscription-service";

export const useBillingPlansQuery = () => {
  return createApiQuery<BillingPlan[]>(
    queryKeys.subscription.plans(),
    () => subscriptionService.listPlans(),
  );
};
