import { createApiQuery } from "@/core/query/create-api-query";
import type { BillingPlan } from "@/features/subscription/contracts";
import { subscriptionService } from "@/features/subscription/services/subscription-service";

export const useBillingPlansQuery = () => {
  return createApiQuery<BillingPlan[]>(
    ["subscription", "plans"],
    () => subscriptionService.listPlans(),
  );
};
