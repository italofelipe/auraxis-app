import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { BillingPlanCard } from "@/features/subscription/components/billing-plan-card";
import type { PlanPresentation } from "@/features/subscription/services/subscription-plan-comparator";

const buildPresentation = (
  override: Partial<PlanPresentation> = {},
): PlanPresentation => ({
  plan: {
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
  },
  kind: "upgrade",
  ctaLabel: "Assinar",
  ctaDisabled: false,
  priceLabel: "R$ 19,90",
  intervalLabel: "/ mes",
  highlighted: false,
  savingsLabel: null,
  ...override,
});

describe("BillingPlanCard", () => {
  it("renderiza titulo, preco e CTA", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <BillingPlanCard presentation={buildPresentation()} onPress={onPress} />
      </AppProviders>,
    );

    expect(getByText("Premium")).toBeTruthy();
    expect(getByText("R$ 19,90")).toBeTruthy();
    expect(getByText("Assinar")).toBeTruthy();
  });

  it("dispara onPress no toque do CTA", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <BillingPlanCard presentation={buildPresentation()} onPress={onPress} />
      </AppProviders>,
    );

    fireEvent.press(getByText("Assinar"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("mostra savingsLabel quando o plano tem economia anual", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <BillingPlanCard
          presentation={buildPresentation({ savingsLabel: "Economize 17% no anual" })}
          onPress={onPress}
        />
      </AppProviders>,
    );

    expect(getByText(/Economize 17%/)).toBeTruthy();
  });

  it("renderiza CTA com label de plano atual quando desabilitado", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <BillingPlanCard
          presentation={buildPresentation({ ctaDisabled: true, ctaLabel: "Plano atual" })}
          onPress={onPress}
        />
      </AppProviders>,
    );

    expect(getByText("Plano atual")).toBeTruthy();
  });
});
