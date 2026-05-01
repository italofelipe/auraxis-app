import { useRouter } from "expo-router";
import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { appRoutes } from "@/core/navigation/routes";
import type { BillingPlan } from "@/features/subscription/contracts";
import { useBillingPlansQuery } from "@/features/subscription/hooks/use-billing-plans-query";
import { useSessionStore } from "@/core/session/session-store";

import type {
  PlansBillingCycle,
  PlansFeatureRow,
  PlansTierView,
} from "@/features/plans/contracts";

const CANONICAL_FEATURE_ROWS: readonly PlansFeatureRow[] = [
  { key: "transactions", free: true, premium: true },
  { key: "goals", free: true, premium: true },
  { key: "basicReports", free: true, premium: true },
  { key: "advancedReports", free: false, premium: true },
  { key: "simulations", free: false, premium: true },
  { key: "sharedEntries", free: false, premium: true },
  { key: "support", free: false, premium: true },
];

export interface PlansScreenController {
  readonly billingCycle: PlansBillingCycle;
  readonly tiers: readonly PlansTierView[];
  readonly featureRows: readonly PlansFeatureRow[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown | null;
  readonly annualDiscountPercent: number;
  readonly toggleCycle: () => void;
  readonly setBillingCycle: Dispatch<SetStateAction<PlansBillingCycle>>;
  readonly handleSelectFreeTier: () => void;
  readonly handleSelectPremiumTier: () => void;
}

const collapseToTier = (
  plans: readonly BillingPlan[],
  tierName: string,
): PlansTierView | null => {
  const matching = plans.filter((p) => p.tier === tierName);
  if (matching.length === 0) {
    return null;
  }
  const monthly = matching.find((p) => p.billingCycle === "monthly") ?? null;
  const annual = matching.find((p) => p.billingCycle === "annual") ?? null;
  const reference = matching[0]!;
  return {
    slug: reference.slug,
    tier: tierName,
    displayName: reference.displayName,
    description: reference.description,
    priceMonthlyCents: monthly?.priceCents ?? 0,
    priceAnnualCents: annual?.priceCents ?? 0,
    currency: reference.currency,
    trialDays: reference.trialDays,
    checkoutEnabled: matching.some((p) => p.checkoutEnabled),
    highlighted: matching.some((p) => p.highlighted),
    hasMonthly: monthly !== null,
    hasAnnual: annual !== null,
  };
};

const computeAnnualDiscountPercent = (tier: PlansTierView | undefined): number => {
  if (
    tier === undefined ||
    tier.priceMonthlyCents === 0 ||
    tier.priceAnnualCents === 0
  ) {
    return 0;
  }
  const annualMonthlyEquivalent = tier.priceAnnualCents / 12;
  const discount =
    (tier.priceMonthlyCents - annualMonthlyEquivalent) / tier.priceMonthlyCents;
  return Math.max(0, Math.round(discount * 100));
};

/**
 * Reactive controller for the public plans landing.
 *
 * Splits the API's per-cycle BillingPlan rows into one tier-per-row view
 * so the toggle can flip prices without a re-query. The "Premium" CTA
 * routes authenticated users straight to the existing subscription
 * screen (where the canonical checkout flow lives) and unauthenticated
 * users to the registration flow with intent to upgrade. The "Free" CTA
 * either lands the user on the dashboard (already authed) or on
 * registration.
 *
 * @returns Bag with toggle state, derived tiers, feature rows and CTA handlers.
 */
export function usePlansScreenController(): PlansScreenController {
  const router = useRouter();
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const query = useBillingPlansQuery();
  const [billingCycle, setBillingCycle] =
    useState<PlansBillingCycle>("monthly");

  const tiers = useMemo<readonly PlansTierView[]>(() => {
    const plans = query.data ?? [];
    const free = collapseToTier(plans, "free");
    const premium = collapseToTier(plans, "premium");
    return [free, premium].filter((t): t is PlansTierView => t !== null);
  }, [query.data]);

  const annualDiscountPercent = useMemo(
    () => computeAnnualDiscountPercent(tiers.find((t) => t.tier === "premium")),
    [tiers],
  );

  const toggleCycle = useCallback((): void => {
    setBillingCycle((prev) => (prev === "monthly" ? "annual" : "monthly"));
  }, []);

  const handleSelectFreeTier = useCallback((): void => {
    router.replace(
      isAuthenticated ? appRoutes.private.dashboard : appRoutes.public.register,
    );
  }, [isAuthenticated, router]);

  const handleSelectPremiumTier = useCallback((): void => {
    router.replace(
      isAuthenticated ? appRoutes.private.subscription : appRoutes.public.register,
    );
  }, [isAuthenticated, router]);

  return {
    billingCycle,
    tiers,
    featureRows: CANONICAL_FEATURE_ROWS,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    annualDiscountPercent,
    toggleCycle,
    setBillingCycle,
    handleSelectFreeTier,
    handleSelectPremiumTier,
  };
}
