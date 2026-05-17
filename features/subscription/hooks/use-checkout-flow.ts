import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "@/core/http/api-error";
import { queryKeys } from "@/core/query/query-keys";
import { useBiometricGate } from "@/core/security/use-biometric-gate";
import type {
  CheckoutSession,
  CreateCheckoutCommand,
} from "@/features/subscription/contracts";
import { useCreateCheckoutMutation } from "@/features/subscription/hooks/use-subscription-mutations";
import {
  type hostedCheckoutService,
  type HostedCheckoutResultType,
} from "@/features/subscription/services/hosted-checkout-service";
import {
  checkoutProviderResolver,
  createHostedCheckoutProvider,
  type CheckoutProvider,
  type CheckoutProviderInput,
  type CheckoutProviderResolver,
} from "@/features/subscription/services/checkout-provider-service";

export type CheckoutOutcome =
  | "completed"
  | "canceled"
  | "dismissed"
  | "opened"
  | "locked"
  | "unavailable";

export interface CheckoutFlowResult {
  readonly outcome: CheckoutOutcome;
  readonly session: CheckoutSession | null;
}

export interface CheckoutFlowController {
  readonly isStarting: boolean;
  readonly lastError: unknown | null;
  readonly start: (command: CreateCheckoutCommand) => Promise<CheckoutFlowResult>;
  readonly resetError: () => void;
}

const RESULT_OUTCOME: Record<HostedCheckoutResultType, CheckoutOutcome> = {
  success: "completed",
  cancel: "canceled",
  dismiss: "dismissed",
  opened: "opened",
  locked: "locked",
};

/**
 * Orchestrates the checkout funnel:
 *   create checkout session -> open hosted checkout -> invalidate state.
 *
 * The subscription and entitlements queries are invalidated unless the user
 * explicitly canceled, so when they come back to the app the new state is
 * fetched immediately. Errors propagate via `lastError` so the screen can
 * surface them without crashing the form pipeline.
 */
export function useCheckoutFlow(
  dependencies: {
    readonly checkoutService?: typeof hostedCheckoutService;
    readonly checkoutProvider?: CheckoutProvider;
    readonly checkoutProviderResolver?: CheckoutProviderResolver;
  } = {},
): CheckoutFlowController {
  const queryClient = useQueryClient();
  const createCheckout = useCreateCheckoutMutation();
  const requestBiometricGate = useBiometricGate();
  const [lastError, setLastError] = useState<unknown | null>(null);
  const checkoutProvider = resolveCheckoutProvider(dependencies);

  const invalidateBillingState = (): void => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.subscription.root });
    void queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.root });
  };

  const start = async (
    command: CreateCheckoutCommand,
  ): Promise<CheckoutFlowResult> => {
    setLastError(null);

    const gate = await requestBiometricGate({
      promptMessage: "Confirme para finalizar checkout",
      required: true,
    });
    if (!gate.authorised) {
      return { outcome: "locked", session: null };
    }

    let session: CheckoutSession | null = null;
    if (checkoutProvider.requiresCheckoutSession) {
      session = await safeCreateCheckout(command, createCheckout, setLastError);
      if (!session) {
        return { outcome: "unavailable", session: null };
      }
      if (!session.checkoutUrl) {
        setLastError(
          new ApiError({ message: "Checkout indisponivel no momento.", status: 503 }),
        );
        return { outcome: "unavailable", session };
      }
    }

    const outcome = await safeOpenCheckout(
      { command, session },
      checkoutProvider,
      setLastError,
    );
    if (!outcome) {
      return { outcome: "unavailable", session };
    }

    if (outcome !== "canceled") {
      invalidateBillingState();
    }

    return { outcome, session };
  };

  return {
    isStarting: createCheckout.isPending,
    lastError,
    start,
    resetError: () => {
      createCheckout.reset();
      setLastError(null);
    },
  };
}

const resolveCheckoutProvider = (
  dependencies: {
    readonly checkoutService?: typeof hostedCheckoutService;
    readonly checkoutProvider?: CheckoutProvider;
    readonly checkoutProviderResolver?: CheckoutProviderResolver;
  },
): CheckoutProvider => {
  if (dependencies.checkoutProvider) {
    return dependencies.checkoutProvider;
  }

  if (dependencies.checkoutService) {
    return createHostedCheckoutProvider(dependencies.checkoutService);
  }

  return (dependencies.checkoutProviderResolver ?? checkoutProviderResolver)
    .resolveProvider();
};

const safeCreateCheckout = async (
  command: CreateCheckoutCommand,
  createCheckout: ReturnType<typeof useCreateCheckoutMutation>,
  onError: (error: unknown) => void,
): Promise<CheckoutSession | null> => {
  try {
    return await createCheckout.mutateAsync(command);
  } catch (error) {
    onError(error);
    return null;
  }
};

const safeOpenCheckout = async (
  input: CheckoutProviderInput,
  checkoutProvider: CheckoutProvider,
  onError: (error: unknown) => void,
): Promise<CheckoutOutcome | null> => {
  try {
    const result = await checkoutProvider.openCheckout(input);
    return RESULT_OUTCOME[result.type] ?? "dismissed";
  } catch (error) {
    onError(error);
    return null;
  }
};
