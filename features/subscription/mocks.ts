import type {
  BillingPlan,
  CheckoutSession,
  SubscriptionState,
} from "@/features/subscription/contracts";

export const billingPlanFixtures: BillingPlan[] = [
  {
    slug: "free",
    planCode: "free",
    tier: "free",
    billingCycle: null,
    displayName: "Free",
    description: "Controle financeiro essencial e simulacoes basicas.",
    priceCents: 0,
    currency: "BRL",
    trialDays: 0,
    checkoutEnabled: false,
    highlighted: false,
  },
  {
    slug: "premium_monthly",
    planCode: "premium",
    tier: "premium",
    billingCycle: "monthly",
    displayName: "Premium Mensal",
    description: "Analises com IA, alertas e briefing semanal.",
    priceCents: 3990,
    currency: "BRL",
    trialDays: 7,
    checkoutEnabled: true,
    highlighted: true,
  },
  {
    slug: "premium_annual",
    planCode: "premium",
    tier: "premium",
    billingCycle: "annual",
    displayName: "Premium Anual",
    description: "Mesmo pacote premium com desconto anual.",
    priceCents: 35880,
    currency: "BRL",
    trialDays: 7,
    checkoutEnabled: true,
    highlighted: false,
  },
];

export const subscriptionFixture: SubscriptionState = {
  id: "sub-1",
  userId: "a6b9a8d2-7d50-47f5-954e-fc8cbb5825aa",
  planCode: "premium",
  offerCode: "premium_monthly",
  status: "active",
  billingCycle: "monthly",
  provider: "asaas",
  providerSubscriptionId: "asaas_sub_123",
  trialEndsAt: "2026-04-14T00:00:00+00:00",
  currentPeriodStart: "2026-04-01T00:00:00+00:00",
  currentPeriodEnd: "2026-05-01T00:00:00+00:00",
  canceledAt: null,
  createdAt: "2026-04-01T00:00:00+00:00",
  updatedAt: "2026-04-07T00:00:00+00:00",
};

export const checkoutSessionFixture: CheckoutSession = {
  planSlug: "premium_monthly",
  planCode: "premium",
  billingCycle: "monthly",
  checkoutUrl: "https://sandbox.asaas.com/c/chk_mock_123",
  provider: "asaas",
};
