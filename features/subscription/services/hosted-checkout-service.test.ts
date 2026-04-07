import { Platform } from "react-native";

import { createHostedCheckoutService } from "@/features/subscription/services/hosted-checkout-service";

const setPlatformOs = (value: string): void => {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    value,
  });
};

describe("hostedCheckoutService", () => {
  beforeEach(() => {
    setPlatformOs("ios");
  });

  it("abre sessao autenticada no mobile usando a URL de retorno do app", async () => {
    const openAuthSessionAsync = jest.fn().mockResolvedValue({
      type: "success",
    });
    const service = createHostedCheckoutService({
      openAuthSessionAsync,
      openBrowserAsync: jest.fn(),
      dismissBrowser: jest.fn(),
    });

    const result = await service.openCheckout({
      planSlug: "premium",
      planCode: "premium_monthly",
      billingCycle: "monthly",
      checkoutUrl: "https://payments.auraxis.dev/checkout/123",
      provider: "asaas",
    });

    expect(openAuthSessionAsync).toHaveBeenCalledWith(
      "https://payments.auraxis.dev/checkout/123",
      "auraxisapp://assinatura?checkout_return=1",
    );
    expect(result).toEqual({
      type: "success",
      returnUrl: "auraxisapp://assinatura?checkout_return=1",
    });
  });

  it("abre navegador externo na web", async () => {
    setPlatformOs("web");

    const openBrowserAsync = jest.fn().mockResolvedValue({
      type: "opened",
    });
    const service = createHostedCheckoutService({
      openAuthSessionAsync: jest.fn(),
      openBrowserAsync,
      dismissBrowser: jest.fn(),
    });

    const result = await service.openCheckout({
      planSlug: "premium",
      planCode: "premium_annual",
      billingCycle: "annual",
      checkoutUrl: "https://payments.auraxis.dev/checkout/annual",
      provider: "asaas",
    });

    expect(openBrowserAsync).toHaveBeenCalled();
    expect(result).toEqual({
      type: "opened",
      returnUrl: "auraxisapp://assinatura?checkout_return=1",
    });
  });

  it("faz fallback para dismiss quando o auth session retorna tipo desconhecido", async () => {
    const openAuthSessionAsync = jest.fn().mockResolvedValue({
      type: "opened",
    });
    const service = createHostedCheckoutService({
      openAuthSessionAsync,
      openBrowserAsync: jest.fn(),
      dismissBrowser: jest.fn(),
    });

    const result = await service.openCheckout({
      planSlug: "premium",
      planCode: "premium_monthly",
      billingCycle: "monthly",
      checkoutUrl: "https://payments.auraxis.dev/checkout/123",
      provider: "asaas",
    });

    expect(result).toEqual({
      type: "dismiss",
      returnUrl: "auraxisapp://assinatura?checkout_return=1",
    });
  });

  it("falha rapido quando a sessao de checkout nao possui URL", async () => {
    const service = createHostedCheckoutService({
      openAuthSessionAsync: jest.fn(),
      openBrowserAsync: jest.fn(),
      dismissBrowser: jest.fn(),
    });

    await expect(
      service.openCheckout({
        planSlug: "premium",
        planCode: "premium_monthly",
        billingCycle: "monthly",
        checkoutUrl: null,
        provider: "asaas",
      }),
    ).rejects.toThrow("Checkout session without checkout URL.");
  });

  it("expõe a rotina de dismiss do browser hospedado", async () => {
    const dismissBrowser = jest.fn().mockResolvedValue(undefined);
    const service = createHostedCheckoutService({
      openAuthSessionAsync: jest.fn(),
      openBrowserAsync: jest.fn(),
      dismissBrowser,
    });

    await service.dismissCheckout();

    expect(dismissBrowser).toHaveBeenCalledTimes(1);
  });
});
