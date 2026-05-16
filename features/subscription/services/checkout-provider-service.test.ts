import { type ApiError } from "@/core/http/api-error";
import type { CheckoutSession } from "@/features/subscription/contracts";
import {
  createCheckoutProviderResolver,
  createHostedCheckoutProvider,
  createStoreCheckoutProvider,
  normalizeCheckoutProviderChannel,
  type CheckoutProvider,
} from "@/features/subscription/services/checkout-provider-service";

const buildSession = (
  overrides: Partial<CheckoutSession> = {},
): CheckoutSession => ({
  planSlug: "premium-monthly",
  planCode: "premium",
  billingCycle: "monthly",
  checkoutUrl: "https://checkout.example.com/session",
  provider: "asaas",
  ...overrides,
});

const buildProvider = (
  overrides: Partial<CheckoutProvider> = {},
): CheckoutProvider => ({
  kind: "hosted",
  requiresCheckoutSession: true,
  openCheckout: jest.fn().mockResolvedValue({ type: "opened", returnUrl: "x://" }),
  dismissCheckout: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("checkout provider service", () => {
  it("normaliza o canal de checkout para hosted por padrão", () => {
    expect(normalizeCheckoutProviderChannel(undefined)).toBe("hosted");
    expect(normalizeCheckoutProviderChannel("")).toBe("hosted");
    expect(normalizeCheckoutProviderChannel("hosted")).toBe("hosted");
    expect(normalizeCheckoutProviderChannel("store")).toBe("store");
    expect(normalizeCheckoutProviderChannel("app-store")).toBe("store");
    expect(normalizeCheckoutProviderChannel("play-store")).toBe("store");
  });

  it("resolve provider hosted e delega para o serviço hospedado", async () => {
    const openCheckout = jest
      .fn()
      .mockResolvedValue({ type: "success", returnUrl: "auraxisapp://assinatura" });
    const hosted = createHostedCheckoutProvider({
      openCheckout,
      dismissCheckout: jest.fn().mockResolvedValue(undefined),
    });

    const result = await hosted.openCheckout({
      command: { planSlug: "premium-monthly" },
      session: buildSession(),
    });

    expect(hosted.kind).toBe("hosted");
    expect(hosted.requiresCheckoutSession).toBe(true);
    expect(openCheckout).toHaveBeenCalledWith(buildSession());
    expect(result.type).toBe("success");
  });

  it("resolve provider store sem depender de checkout URL hospedada", () => {
    const hostedProvider = buildProvider({ kind: "hosted" });
    const storeProvider = buildProvider({
      kind: "store",
      requiresCheckoutSession: false,
    });
    const resolver = createCheckoutProviderResolver({
      getChannel: () => "store",
      hostedProvider,
      storeProvider,
    });

    expect(resolver.resolveProvider()).toBe(storeProvider);
  });

  it("provider store falha de forma segura enquanto StoreKit/Play Billing nao estao configurados", async () => {
    const store = createStoreCheckoutProvider();

    await expect(
      store.openCheckout({
        command: { planSlug: "premium-monthly" },
        session: null,
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      code: "STORE_CHECKOUT_UNCONFIGURED",
      status: 503,
    } satisfies Partial<ApiError>);
  });
});
