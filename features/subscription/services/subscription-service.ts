import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  BillingPlan,
  CheckoutSession,
  CreateCheckoutCommand,
  SubscriptionState,
} from "@/features/subscription/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface BillingPlanPayload {
  readonly slug: string;
  readonly plan_code: string;
  readonly tier: string;
  readonly billing_cycle: BillingPlan["billingCycle"];
  readonly display_name: string;
  readonly description: string;
  readonly price_cents: number;
  readonly currency: string;
  readonly trial_days: number;
  readonly checkout_enabled: boolean;
  readonly highlighted: boolean;
}

interface SubscriptionPayload {
  readonly id: string;
  readonly user_id: string;
  readonly plan_code: string;
  readonly offer_code: string | null;
  readonly status: SubscriptionState["status"];
  readonly billing_cycle: SubscriptionState["billingCycle"];
  readonly provider: string | null;
  readonly provider_subscription_id: string | null;
  readonly trial_ends_at: string | null;
  readonly current_period_start: string | null;
  readonly current_period_end: string | null;
  readonly canceled_at: string | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
}

interface CheckoutPayload {
  readonly plan_slug: string;
  readonly plan_code: string;
  readonly billing_cycle: CheckoutSession["billingCycle"];
  readonly checkout_url: string | null;
  readonly provider: string | null;
}

const mapPlan = (payload: BillingPlanPayload): BillingPlan => {
  return {
    slug: payload.slug,
    planCode: payload.plan_code,
    tier: payload.tier,
    billingCycle: payload.billing_cycle,
    displayName: payload.display_name,
    description: payload.description,
    priceCents: payload.price_cents,
    currency: payload.currency,
    trialDays: payload.trial_days,
    checkoutEnabled: payload.checkout_enabled,
    highlighted: payload.highlighted,
  };
};

const mapSubscription = (payload: SubscriptionPayload): SubscriptionState => {
  return {
    id: payload.id,
    userId: payload.user_id,
    planCode: payload.plan_code,
    offerCode: payload.offer_code,
    status: payload.status,
    billingCycle: payload.billing_cycle,
    provider: payload.provider,
    providerSubscriptionId: payload.provider_subscription_id,
    trialEndsAt: payload.trial_ends_at,
    currentPeriodStart: payload.current_period_start,
    currentPeriodEnd: payload.current_period_end,
    canceledAt: payload.canceled_at,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  };
};

const mapCheckout = (payload: CheckoutPayload): CheckoutSession => {
  return {
    planSlug: payload.plan_slug,
    planCode: payload.plan_code,
    billingCycle: payload.billing_cycle,
    checkoutUrl: payload.checkout_url,
    provider: payload.provider,
  };
};

export const createSubscriptionService = (client: AxiosInstance) => {
  return {
    listPlans: async (): Promise<BillingPlan[]> => {
      const response = await client.get(apiContractMap.subscriptionPlans.path);
      const payload = unwrapEnvelopeData<{ readonly plans: BillingPlanPayload[] }>(
        response.data,
      );
      return payload.plans.map(mapPlan);
    },
    getSubscription: async (): Promise<SubscriptionState> => {
      const response = await client.get(apiContractMap.subscriptionMe.path);
      const payload = unwrapEnvelopeData<{
        readonly subscription: SubscriptionPayload;
      }>(response.data);
      return mapSubscription(payload.subscription);
    },
    createCheckout: async (
      command: CreateCheckoutCommand,
    ): Promise<CheckoutSession> => {
      const response = await client.post(apiContractMap.subscriptionCheckout.path, {
        plan_slug: command.planSlug,
        billing_cycle: command.billingCycle,
      });

      return mapCheckout(unwrapEnvelopeData<CheckoutPayload>(response.data));
    },
    cancelSubscription: async (): Promise<SubscriptionState> => {
      const response = await client.post(apiContractMap.subscriptionCancel.path);
      const payload = unwrapEnvelopeData<{
        readonly subscription: SubscriptionPayload;
      }>(response.data);
      return mapSubscription(payload.subscription);
    },
    startTrial: async (): Promise<SubscriptionState> => {
      const response = await client.post(apiContractMap.subscriptionTrial.path);
      const payload = unwrapEnvelopeData<{
        readonly subscription: SubscriptionPayload;
      }>(response.data);
      return mapSubscription(payload.subscription);
    },
  };
};

export const subscriptionService = createSubscriptionService(httpClient);
