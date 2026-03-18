export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

export interface Subscription {
  readonly plan_slug: string;
  readonly status: SubscriptionStatus;
  readonly trial_ends_at: string | null;
  readonly current_period_end: string | null;
}
