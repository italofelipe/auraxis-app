import { createApiMutation } from "@/core/query/create-api-mutation";
import type {
  CheckoutSession,
  CreateCheckoutCommand,
  SubscriptionState,
} from "@/features/subscription/contracts";
import { subscriptionService } from "@/features/subscription/services/subscription-service";

export const useCreateCheckoutMutation = () => {
  return createApiMutation<CheckoutSession, CreateCheckoutCommand>(
    subscriptionService.createCheckout,
  );
};

export const useCancelSubscriptionMutation = () => {
  return createApiMutation<SubscriptionState, void>(() =>
    subscriptionService.cancelSubscription(),
  );
};
