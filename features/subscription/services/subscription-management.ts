import type {
  SubscriptionState,
  SubscriptionStatus,
} from "@/features/subscription/contracts";
import {
  APPLE_SUBSCRIPTIONS_URL,
  GOOGLE_PLAY_SUBSCRIPTIONS_URL,
  MANAGE_SUBSCRIPTION_URL,
} from "@/shared/config/web-urls";

export type SubscriptionManagementMode =
  | "api"
  | "app-store"
  | "play-store"
  | "web";

export interface SubscriptionManagementAction {
  readonly mode: SubscriptionManagementMode;
  readonly label: string;
  readonly description: string;
  readonly url: string | null;
}

const API_MANAGED_PROVIDERS = new Set(["asaas", "stub"]);
const APP_STORE_PROVIDERS = new Set([
  "apple",
  "app_store",
  "app-store",
  "appstore",
]);
const PLAY_STORE_PROVIDERS = new Set([
  "google",
  "google_play",
  "google-play",
  "play_store",
  "play-store",
]);
const CANCELLABLE_STATUSES = new Set<SubscriptionStatus>([
  "trialing",
  "active",
  "past_due",
]);

const normalizeProvider = (provider: string | null): string | null => {
  const normalized = provider?.trim().toLowerCase();
  return normalized ? normalized : null;
};

/**
 * Resolves the safe management surface for the subscription's billing owner.
 * Store-owned subscriptions must be managed by the corresponding store,
 * whereas Auraxis billing providers use the canonical cancellation endpoint.
 */
export const resolveSubscriptionManagementAction = (
  subscription: SubscriptionState | null,
): SubscriptionManagementAction | null => {
  if (!subscription) {
    return null;
  }

  const provider = normalizeProvider(subscription.provider);

  if (provider && APP_STORE_PROVIDERS.has(provider)) {
    return {
      mode: "app-store",
      label: "Gerenciar na App Store",
      description:
        "A Apple controla a renovacao e o cancelamento desta assinatura.",
      url: APPLE_SUBSCRIPTIONS_URL,
    };
  }

  if (provider && PLAY_STORE_PROVIDERS.has(provider)) {
    return {
      mode: "play-store",
      label: "Gerenciar no Google Play",
      description:
        "O Google Play controla a renovacao e o cancelamento desta assinatura.",
      url: GOOGLE_PLAY_SUBSCRIPTIONS_URL,
    };
  }

  if (!CANCELLABLE_STATUSES.has(subscription.status)) {
    return null;
  }

  if (!provider || API_MANAGED_PROVIDERS.has(provider)) {
    return {
      mode: "api",
      label: "Cancelar assinatura",
      description:
        "O cancelamento interrompe a renovacao e preserva o acesso ja contratado.",
      url: null,
    };
  }

  return {
    mode: "web",
    label: "Gerenciar na Web",
    description:
      "Este provedor deve ser gerenciado na pagina segura de assinatura da Auraxis.",
    url: MANAGE_SUBSCRIPTION_URL,
  };
};
