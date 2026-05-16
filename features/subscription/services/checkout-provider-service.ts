import { ApiError } from "@/core/http/api-error";
import { appRuntimeConfig } from "@/shared/config/runtime";
import type {
  CheckoutSession,
  CreateCheckoutCommand,
} from "@/features/subscription/contracts";
import {
  hostedCheckoutService,
  type HostedCheckoutResult,
} from "@/features/subscription/services/hosted-checkout-service";
import {
  normalizeCheckoutProviderChannel,
  type CheckoutProviderChannel,
} from "@/shared/config/checkout-provider-channel";

export type CheckoutProviderKind = CheckoutProviderChannel;

export interface CheckoutProviderInput {
  readonly command: CreateCheckoutCommand;
  readonly session: CheckoutSession | null;
}

export interface CheckoutProvider {
  readonly kind: CheckoutProviderKind;
  readonly requiresCheckoutSession: boolean;
  readonly openCheckout: (
    input: CheckoutProviderInput,
  ) => Promise<HostedCheckoutResult>;
  readonly dismissCheckout: () => Promise<void>;
}

export interface CheckoutProviderResolver {
  readonly resolveProvider: () => CheckoutProvider;
}

interface HostedCheckoutService {
  readonly openCheckout: (
    checkoutSession: CheckoutSession,
  ) => Promise<HostedCheckoutResult>;
  readonly dismissCheckout: () => Promise<void>;
}

interface CheckoutProviderResolverDependencies {
  readonly getChannel: () => CheckoutProviderChannel;
  readonly hostedProvider: CheckoutProvider;
  readonly storeProvider: CheckoutProvider;
}

export { normalizeCheckoutProviderChannel };

export const createHostedCheckoutProvider = (
  service: HostedCheckoutService = hostedCheckoutService,
): CheckoutProvider => ({
  kind: "hosted",
  requiresCheckoutSession: true,
  openCheckout: async ({ session }): Promise<HostedCheckoutResult> => {
    if (!session) {
      throw new Error("Hosted checkout provider requires a checkout session.");
    }

    return service.openCheckout(session);
  },
  dismissCheckout: service.dismissCheckout,
});

export const createStoreCheckoutProvider = (): CheckoutProvider => ({
  kind: "store",
  requiresCheckoutSession: false,
  openCheckout: async (): Promise<HostedCheckoutResult> => {
    throw new ApiError({
      message:
        "Compras pela loja ainda nao estao configuradas para este build.",
      status: 503,
      code: "STORE_CHECKOUT_UNCONFIGURED",
    });
  },
  dismissCheckout: async (): Promise<void> => undefined,
});

export const createCheckoutProviderResolver = ({
  getChannel,
  hostedProvider,
  storeProvider,
}: CheckoutProviderResolverDependencies): CheckoutProviderResolver => ({
  resolveProvider: (): CheckoutProvider => {
    return getChannel() === "store" ? storeProvider : hostedProvider;
  },
});

export const checkoutProviderResolver = createCheckoutProviderResolver({
  getChannel: () => appRuntimeConfig.checkoutProviderChannel,
  hostedProvider: createHostedCheckoutProvider(),
  storeProvider: createStoreCheckoutProvider(),
});
