import type { BillingCycle, BillingPlan } from "@/features/subscription/contracts";

/**
 * UI-shaped tier descriptor for the public plans landing.
 *
 * The API returns one {@link BillingPlan} per `(planCode, billingCycle)`
 * combination. The plans page wants both cycles side-by-side per tier so
 * the user can flip the toggle without re-querying. {@link PlansTierView}
 * collapses both cycles into a single object the screen renders against.
 */
export interface PlansTierView {
  readonly slug: string;
  readonly tier: string;
  readonly displayName: string;
  readonly description: string;
  readonly priceMonthlyCents: number;
  readonly priceAnnualCents: number;
  readonly currency: string;
  readonly trialDays: number;
  readonly checkoutEnabled: boolean;
  readonly highlighted: boolean;
  readonly hasMonthly: boolean;
  readonly hasAnnual: boolean;
}

export type PlansBillingCycle = Exclude<BillingCycle, null>;

/**
 * Static feature row used by the comparison panel. Free vs Premium are
 * the two canonical tiers — features come from i18n so the copy stays
 * synced between web and app without recompiling.
 */
export interface PlansFeatureRow {
  readonly key: string;
  readonly free: boolean;
  readonly premium: boolean;
}

export type { BillingPlan };
