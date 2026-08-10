import type { SubscriptionState } from "@/features/subscription/contracts";
import { resolveSubscriptionManagementAction } from "@/features/subscription/services/subscription-management";
import {
  APPLE_SUBSCRIPTIONS_URL,
  GOOGLE_PLAY_SUBSCRIPTIONS_URL,
  MANAGE_SUBSCRIPTION_URL,
} from "@/shared/config/web-urls";

const buildSubscription = (
  override: Partial<SubscriptionState> = {},
): SubscriptionState => ({
  id: "sub-1",
  userId: "user-1",
  planCode: "premium",
  offerCode: null,
  status: "active",
  billingCycle: "monthly",
  provider: "asaas",
  providerSubscriptionId: "provider-sub-1",
  trialEndsAt: null,
  currentPeriodStart: "2026-07-01T00:00:00Z",
  currentPeriodEnd: "2026-08-01T00:00:00Z",
  canceledAt: null,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  ...override,
});

describe("resolveSubscriptionManagementAction", () => {
  it.each(["asaas", "stub"])(
    "cancela provider %s pela API canonica",
    (provider) => {
      expect(
        resolveSubscriptionManagementAction(buildSubscription({ provider })),
      ).toMatchObject({
        mode: "api",
        label: "Cancelar assinatura",
        url: null,
      });
    },
  );

  it("permite cancelar trial interno sem provider pela API", () => {
    expect(
      resolveSubscriptionManagementAction(
        buildSubscription({ provider: null, status: "trialing" }),
      ),
    ).toMatchObject({ mode: "api" });
  });

  it.each(["apple", "app_store", "app-store", "appstore"])(
    "direciona provider Apple %s para a App Store",
    (provider) => {
      expect(
        resolveSubscriptionManagementAction(buildSubscription({ provider })),
      ).toMatchObject({
        mode: "app-store",
        url: APPLE_SUBSCRIPTIONS_URL,
      });
    },
  );

  it.each(["google", "google_play", "google-play", "play_store", "play-store"])(
    "direciona provider Google %s para o Google Play",
    (provider) => {
      expect(
        resolveSubscriptionManagementAction(buildSubscription({ provider })),
      ).toMatchObject({
        mode: "play-store",
        url: GOOGLE_PLAY_SUBSCRIPTIONS_URL,
      });
    },
  );

  it("usa a pagina Web canonica para provider desconhecido", () => {
    expect(
      resolveSubscriptionManagementAction(
        buildSubscription({ provider: "future-provider" }),
      ),
    ).toMatchObject({
      mode: "web",
      url: MANAGE_SUBSCRIPTION_URL,
    });
    expect(MANAGE_SUBSCRIPTION_URL).toBe(
      "https://app.auraxis.com.br/subscription",
    );
  });

  it.each(["free", "canceled", "expired"] as const)(
    "nao oferece novo cancelamento para status %s gerenciado pela API",
    (status) => {
      expect(
        resolveSubscriptionManagementAction(buildSubscription({ status })),
      ).toBeNull();
    },
  );

  it("mantem acesso a gestao da loja depois do cancelamento", () => {
    expect(
      resolveSubscriptionManagementAction(
        buildSubscription({ provider: "google_play", status: "canceled" }),
      ),
    ).toMatchObject({ mode: "play-store" });
  });
});
