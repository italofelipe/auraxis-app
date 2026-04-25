import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Linking } from "react-native";

import { queryKeys } from "@/core/query/query-keys";
import type {
  BillingPlan,
  CreateCheckoutCommand,
  SubscriptionState,
} from "@/features/subscription/contracts";
import { useBillingPlansQuery } from "@/features/subscription/hooks/use-billing-plans-query";
import {
  useCheckoutFlow,
  type CheckoutOutcome,
} from "@/features/subscription/hooks/use-checkout-flow";
import {
  useStartTrialMutation,
} from "@/features/subscription/hooks/use-subscription-mutations";
import { useSubscriptionStateQuery } from "@/features/subscription/hooks/use-subscription-query";
import {
  subscriptionPlanComparator,
  type PlanPresentation,
} from "@/features/subscription/services/subscription-plan-comparator";
import { MANAGE_SUBSCRIPTION_URL } from "@/shared/config/web-urls";

export interface SubscriptionScreenController {
  readonly subscriptionQuery: ReturnType<typeof useSubscriptionStateQuery>;
  readonly plansQuery: ReturnType<typeof useBillingPlansQuery>;
  readonly subscription: SubscriptionState | null;
  readonly presentations: readonly PlanPresentation[];
  readonly trialOffer: BillingPlan | null;
  readonly isStartingCheckout: boolean;
  readonly isStartingTrial: boolean;
  readonly checkoutError: unknown | null;
  readonly trialError: unknown | null;
  readonly lastCheckoutOutcome: CheckoutOutcome | null;
  readonly handleSubscribe: (plan: BillingPlan) => Promise<void>;
  readonly handleStartTrial: () => Promise<void>;
  readonly handleManageSubscription: () => Promise<void>;
  readonly dismissCheckoutError: () => void;
  readonly dismissTrialError: () => void;
}

const buildCheckoutCommand = (plan: BillingPlan): CreateCheckoutCommand => {
  if (plan.billingCycle === "monthly" || plan.billingCycle === "annual") {
    return { planSlug: plan.slug, billingCycle: plan.billingCycle };
  }
  return { planSlug: plan.slug };
};

/**
 * Canonical controller for the subscription screen. Coordinates the
 * subscription state, the available plans, the trial CTA and the hosted
 * checkout flow.
 */
export function useSubscriptionScreenController(): SubscriptionScreenController {
  const queryClient = useQueryClient();
  const subscriptionQuery = useSubscriptionStateQuery();
  const plansQuery = useBillingPlansQuery();
  const checkout = useCheckoutFlow();
  const trialMutation = useStartTrialMutation();
  const [trialError, setTrialError] = useState<unknown | null>(null);
  const [lastCheckoutOutcome, setLastCheckoutOutcome] =
    useState<CheckoutOutcome | null>(null);

  const subscription = subscriptionQuery.data ?? null;
  const plansData = plansQuery.data;
  const plans = useMemo(() => plansData ?? [], [plansData]);

  const presentations = useMemo(
    () => subscriptionPlanComparator.present(plans, subscription),
    [plans, subscription],
  );
  const trialOffer = useMemo(
    () => subscriptionPlanComparator.trialOffer(plans, subscription),
    [plans, subscription],
  );

  const handleSubscribe = async (plan: BillingPlan): Promise<void> => {
    const result = await checkout.start(buildCheckoutCommand(plan));
    setLastCheckoutOutcome(result.outcome);
  };

  const handleStartTrial = async (): Promise<void> => {
    setTrialError(null);
    try {
      await trialMutation.mutateAsync();
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscription.root });
      void queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.root });
    } catch (error) {
      setTrialError(error);
    }
  };

  return {
    subscriptionQuery,
    plansQuery,
    subscription,
    presentations,
    trialOffer,
    isStartingCheckout: checkout.isStarting,
    isStartingTrial: trialMutation.isPending,
    checkoutError: checkout.lastError,
    trialError,
    lastCheckoutOutcome,
    handleSubscribe,
    handleStartTrial,
    handleManageSubscription: async () => Linking.openURL(MANAGE_SUBSCRIPTION_URL),
    dismissCheckoutError: () => {
      checkout.resetError();
      setLastCheckoutOutcome(null);
    },
    dismissTrialError: () => {
      trialMutation.reset();
      setTrialError(null);
    },
  };
}
