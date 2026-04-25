import type {
  BillingPlan,
  SubscriptionState,
} from "@/features/subscription/contracts";

export type PlanCardKind =
  | "current"
  | "upgrade"
  | "downgrade"
  | "trial-available"
  | "trial-active"
  | "other";

export interface PlanPresentation {
  readonly plan: BillingPlan;
  readonly kind: PlanCardKind;
  readonly ctaLabel: string;
  readonly ctaDisabled: boolean;
  readonly priceLabel: string;
  readonly intervalLabel: string;
  readonly highlighted: boolean;
  readonly savingsLabel: string | null;
}

const TIER_RANK: Record<string, number> = {
  free: 0,
  premium: 1,
};

const formatBrl = (cents: number): string => {
  const amount = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(amount);
};

const intervalLabel = (cycle: BillingPlan["billingCycle"]): string => {
  if (cycle === "monthly") {
    return "/ mes";
  }
  if (cycle === "annual") {
    return "/ ano";
  }
  return "";
};

const isTrialActive = (subscription: SubscriptionState | null): boolean => {
  if (!subscription) {
    return false;
  }
  if (subscription.status !== "trialing") {
    return false;
  }
  if (!subscription.trialEndsAt) {
    return true;
  }
  return new Date(subscription.trialEndsAt).getTime() > Date.now();
};

/**
 * Encapsulates the visual/state logic that turns a list of `BillingPlan`s
 * into UI-ready presentations relative to the user's current subscription.
 *
 * The class lives apart from the React layer so the same projection can power
 * the subscription screen, the upgrade CTA, and any future plan comparison.
 */
export class SubscriptionPlanComparator {
  // eslint-disable-next-line class-methods-use-this
  present(
    plans: readonly BillingPlan[],
    subscription: SubscriptionState | null,
  ): readonly PlanPresentation[] {
    const monthlyByTier = new Map<string, BillingPlan>();
    for (const plan of plans) {
      if (plan.billingCycle === "monthly") {
        monthlyByTier.set(plan.tier, plan);
      }
    }

    return plans.map((plan) =>
      describePlan(plan, subscription, monthlyByTier.get(plan.tier) ?? null),
    );
  }

  // eslint-disable-next-line class-methods-use-this
  trialOffer(
    plans: readonly BillingPlan[],
    subscription: SubscriptionState | null,
  ): BillingPlan | null {
    if (subscription?.status === "trialing" || subscription?.status === "active") {
      return null;
    }
    return (
      plans.find((plan) => plan.tier !== "free" && plan.trialDays > 0) ?? null
    );
  }
}

const isCurrentPlan = (
  plan: BillingPlan,
  subscription: SubscriptionState | null,
): boolean => {
  return (
    !!subscription &&
    subscription.planCode === plan.planCode &&
    subscription.billingCycle === plan.billingCycle
  );
};

const isTrialOffer = (
  plan: BillingPlan,
  subscription: SubscriptionState | null,
): boolean => {
  return (
    plan.trialDays > 0 && !subscription?.trialEndsAt && plan.tier !== "free"
  );
};

const describePlan = (
  plan: BillingPlan,
  subscription: SubscriptionState | null,
  monthlySibling: BillingPlan | null,
): PlanPresentation => {
  const options = { monthlySibling };

  if (isCurrentPlan(plan, subscription)) {
    if (isTrialActive(subscription)) {
      return buildPresentation(plan, "trial-active", {
        ...options,
        ctaLabel: "Plano atual (trial)",
        ctaDisabled: true,
      });
    }
    return buildPresentation(plan, "current", {
      ...options,
      ctaLabel: "Plano atual",
      ctaDisabled: true,
    });
  }

  const planRank = TIER_RANK[plan.tier] ?? 0;
  const currentRank = TIER_RANK[subscription?.planCode ?? ""] ?? TIER_RANK.free;

  if (planRank < currentRank) {
    return buildPresentation(plan, "downgrade", {
      ...options,
      ctaLabel: "Mudar de plano",
      ctaDisabled: !plan.checkoutEnabled,
    });
  }

  if (isTrialOffer(plan, subscription)) {
    return buildPresentation(plan, "trial-available", {
      ...options,
      ctaLabel: `Iniciar trial de ${plan.trialDays} dias`,
      ctaDisabled: false,
    });
  }

  return buildPresentation(plan, planRank > currentRank ? "upgrade" : "other", {
    ...options,
    ctaLabel: "Assinar",
    ctaDisabled: !plan.checkoutEnabled,
  });
};

interface PresentationOptions {
  readonly ctaLabel: string;
  readonly ctaDisabled: boolean;
  readonly monthlySibling: BillingPlan | null;
}

const buildPresentation = (
  plan: BillingPlan,
  kind: PlanCardKind,
  { ctaLabel, ctaDisabled, monthlySibling }: PresentationOptions,
): PlanPresentation => {
  return {
    plan,
    kind,
    ctaLabel,
    ctaDisabled,
    priceLabel: formatBrl(plan.priceCents),
    intervalLabel: intervalLabel(plan.billingCycle),
    highlighted: plan.highlighted,
    savingsLabel: computeSavings(plan, monthlySibling),
  };
};

const computeSavings = (
  plan: BillingPlan,
  monthlySibling: BillingPlan | null,
): string | null => {
  if (plan.billingCycle !== "annual" || !monthlySibling) {
    return null;
  }
  const monthlyAnnualized = monthlySibling.priceCents * 12;
  if (monthlyAnnualized <= 0 || plan.priceCents <= 0) {
    return null;
  }
  const savings = monthlyAnnualized - plan.priceCents;
  if (savings <= 0) {
    return null;
  }
  const percent = Math.round((savings / monthlyAnnualized) * 100);
  return `Economize ${percent}% no anual`;
};

export const subscriptionPlanComparator = new SubscriptionPlanComparator();
