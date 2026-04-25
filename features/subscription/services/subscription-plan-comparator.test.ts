import { subscriptionPlanComparator } from "@/features/subscription/services/subscription-plan-comparator";
import type {
  BillingPlan,
  SubscriptionState,
} from "@/features/subscription/contracts";

const buildPlan = (override: Partial<BillingPlan> = {}): BillingPlan => ({
  slug: "premium-monthly",
  planCode: "premium",
  tier: "premium",
  billingCycle: "monthly",
  displayName: "Premium",
  description: "Plano completo",
  priceCents: 1990,
  currency: "BRL",
  trialDays: 30,
  checkoutEnabled: true,
  highlighted: false,
  ...override,
});

const buildSubscription = (
  override: Partial<SubscriptionState> = {},
): SubscriptionState => ({
  id: "sub-1",
  userId: "user-1",
  planCode: "free",
  offerCode: null,
  status: "free",
  billingCycle: null,
  provider: null,
  providerSubscriptionId: null,
  trialEndsAt: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  canceledAt: null,
  createdAt: null,
  updatedAt: null,
  ...override,
});

describe("SubscriptionPlanComparator.present", () => {
  it("marca plano atual como current e desabilita CTA", () => {
    const monthly = buildPlan({ planCode: "premium", billingCycle: "monthly" });
    const subscription = buildSubscription({
      planCode: "premium",
      billingCycle: "monthly",
      status: "active",
    });

    const [presentation] = subscriptionPlanComparator.present([monthly], subscription);
    expect(presentation.kind).toBe("current");
    expect(presentation.ctaDisabled).toBe(true);
    expect(presentation.priceLabel).toContain("19,90");
    expect(presentation.intervalLabel).toBe("/ mes");
  });

  it("oferece trial para usuario free quando o plano permite", () => {
    const monthly = buildPlan({ trialDays: 30 });
    const subscription = buildSubscription();

    const [presentation] = subscriptionPlanComparator.present([monthly], subscription);
    expect(presentation.kind).toBe("trial-available");
    expect(presentation.ctaLabel).toContain("trial");
    expect(presentation.ctaDisabled).toBe(false);
  });

  it("aponta upgrade quando rank do plano e maior que o atual", () => {
    const monthly = buildPlan({ trialDays: 0 });
    const subscription = buildSubscription();

    const [presentation] = subscriptionPlanComparator.present([monthly], subscription);
    expect(presentation.kind).toBe("upgrade");
    expect(presentation.ctaLabel).toBe("Assinar");
  });

  it("calcula economia do plano anual em relacao ao mensal", () => {
    const monthly = buildPlan({
      slug: "premium-m",
      billingCycle: "monthly",
      priceCents: 1990,
    });
    const annual = buildPlan({
      slug: "premium-a",
      billingCycle: "annual",
      priceCents: 19900,
    });

    const result = subscriptionPlanComparator.present(
      [monthly, annual],
      buildSubscription(),
    );
    const annualPresentation = result.find((p) => p.plan.slug === "premium-a");
    expect(annualPresentation?.savingsLabel).toMatch(/Economize \d+%/);
    expect(annualPresentation?.intervalLabel).toBe("/ ano");
  });

  it("desabilita CTA quando checkout nao esta habilitado", () => {
    const plan = buildPlan({ trialDays: 0, checkoutEnabled: false });
    const [presentation] = subscriptionPlanComparator.present(
      [plan],
      buildSubscription(),
    );
    expect(presentation.ctaDisabled).toBe(true);
  });

  it("classifica plano em ciclo trial como trial-active", () => {
    const monthly = buildPlan();
    const futureTrial = new Date(Date.now() + 86_400_000).toISOString();
    const subscription = buildSubscription({
      planCode: "premium",
      billingCycle: "monthly",
      status: "trialing",
      trialEndsAt: futureTrial,
    });

    const [presentation] = subscriptionPlanComparator.present([monthly], subscription);
    expect(presentation.kind).toBe("trial-active");
    expect(presentation.ctaDisabled).toBe(true);
  });
});

describe("SubscriptionPlanComparator.trialOffer", () => {
  it("retorna o primeiro plano premium com trial quando user e free", () => {
    const free = buildPlan({ tier: "free", trialDays: 0, planCode: "free" });
    const premium = buildPlan({ trialDays: 30 });
    const offer = subscriptionPlanComparator.trialOffer(
      [free, premium],
      buildSubscription(),
    );
    expect(offer?.planCode).toBe("premium");
  });

  it("nao oferece trial quando user esta em trial ou ativo", () => {
    const premium = buildPlan({ trialDays: 30 });
    const subscription = buildSubscription({ status: "active" });
    expect(
      subscriptionPlanComparator.trialOffer([premium], subscription),
    ).toBeNull();
  });
});
