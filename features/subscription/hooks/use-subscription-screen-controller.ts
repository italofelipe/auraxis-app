import { Linking } from "react-native";

import { useSubscriptionStateQuery } from "@/features/subscription/hooks/use-subscription-query";
import { MANAGE_SUBSCRIPTION_URL } from "@/shared/config/web-urls";

export interface SubscriptionScreenController {
  readonly subscriptionQuery: ReturnType<typeof useSubscriptionStateQuery>;
  readonly handleManageSubscription: () => Promise<void>;
}

/**
 * Creates the canonical controller for the subscription management screen.
 *
 * @returns View bindings for subscription status and external management flow.
 */
export function useSubscriptionScreenController(): SubscriptionScreenController {
  const subscriptionQuery = useSubscriptionStateQuery();

  return {
    subscriptionQuery,
    handleManageSubscription: async () => Linking.openURL(MANAGE_SUBSCRIPTION_URL),
  };
}
