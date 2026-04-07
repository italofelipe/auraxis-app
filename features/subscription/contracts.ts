export type BillingCycle = "monthly" | "annual" | null;

export type SubscriptionStatus =
  | "free"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export interface BillingPlan {
  readonly slug: string;
  readonly planCode: string;
  readonly tier: string;
  readonly billingCycle: BillingCycle;
  readonly displayName: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly trialDays: number;
  readonly checkoutEnabled: boolean;
  readonly highlighted: boolean;
}

export interface SubscriptionState {
  readonly id: string;
  readonly userId: string;
  readonly planCode: string;
  readonly offerCode: string | null;
  readonly status: SubscriptionStatus;
  readonly billingCycle: BillingCycle;
  readonly provider: string | null;
  readonly providerSubscriptionId: string | null;
  readonly trialEndsAt: string | null;
  readonly currentPeriodStart: string | null;
  readonly currentPeriodEnd: string | null;
  readonly canceledAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface CreateCheckoutCommand {
  readonly planSlug: string;
  readonly billingCycle?: Exclude<BillingCycle, null>;
}

export interface CheckoutSession {
  readonly planSlug: string;
  readonly planCode: string;
  readonly billingCycle: BillingCycle;
  readonly checkoutUrl: string | null;
  readonly provider: string | null;
}
