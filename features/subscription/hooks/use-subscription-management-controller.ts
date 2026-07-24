import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Linking } from "react-native";

import type { AnalyticsClient } from "@/core/observability/analytics-types";
import { useAnalytics } from "@/core/observability/use-analytics";
import { queryKeys } from "@/core/query/query-keys";
import type { SubscriptionState } from "@/features/subscription/contracts";
import { useCancelSubscriptionMutation } from "@/features/subscription/hooks/use-subscription-mutations";
import {
  resolveSubscriptionManagementAction,
  type SubscriptionManagementAction,
} from "@/features/subscription/services/subscription-management";

export interface SubscriptionManagementController {
  readonly isCancelingSubscription: boolean;
  readonly isCancelConfirmationOpen: boolean;
  readonly cancelError: unknown | null;
  readonly managementError: unknown | null;
  readonly lastCanceledSubscription: SubscriptionState | null;
  readonly managementAction: SubscriptionManagementAction | null;
  readonly handleManageSubscription: () => Promise<void>;
  readonly handleCancelSubscription: () => Promise<void>;
  readonly closeCancelConfirmation: () => void;
  readonly dismissManagementError: () => void;
  readonly dismissCancellationFeedback: () => void;
}

interface ManageHandlerOptions {
  readonly action: SubscriptionManagementAction | null;
  readonly subscription: SubscriptionState | null;
  readonly analytics: AnalyticsClient;
  readonly setCancelError: (error: unknown | null) => void;
  readonly setManagementError: (error: unknown | null) => void;
  readonly setConfirmationOpen: (open: boolean) => void;
}

const createManageHandler =
  (options: ManageHandlerOptions) => async (): Promise<void> => {
    const { action } = options;
    if (!action) {
      return;
    }

    options.setManagementError(null);
    if (action.mode === "api") {
      options.setCancelError(null);
      options.setConfirmationOpen(true);
      return;
    }

    if (!action.url) {
      return;
    }

    try {
      await Linking.openURL(action.url);
      options.analytics.capture("subscription.management.opened", {
        provider: options.subscription?.provider ?? "unknown",
        mode: action.mode,
        status: "opened",
      });
    } catch (error) {
      options.setManagementError(error);
    }
  };

interface CancelHandlerOptions {
  readonly action: SubscriptionManagementAction | null;
  readonly subscription: SubscriptionState | null;
  readonly analytics: AnalyticsClient;
  readonly queryClient: QueryClient;
  readonly mutation: ReturnType<typeof useCancelSubscriptionMutation>;
  readonly inFlight: { current: boolean };
  readonly setError: (error: unknown | null) => void;
  readonly setConfirmationOpen: (open: boolean) => void;
  readonly setCanceledSubscription: (subscription: SubscriptionState) => void;
}

const createCancelHandler =
  (options: CancelHandlerOptions) => async (): Promise<void> => {
    const { action, inFlight, mutation, queryClient, subscription } = options;
    if (inFlight.current || action?.mode !== "api" || !subscription) {
      return;
    }

    inFlight.current = true;
    options.setError(null);
    mutation.reset();
    try {
      const canceledSubscription = await mutation.mutateAsync();
      queryClient.setQueryData(
        queryKeys.subscription.me(),
        canceledSubscription,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.root,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.root,
      });
      options.setCanceledSubscription(canceledSubscription);
      options.setConfirmationOpen(false);
      options.analytics.capture("subscription.cancel.completed", {
        provider: subscription.provider ?? "internal",
        mode: "api",
        status: "completed",
      });
    } catch (error) {
      options.setError(error);
    } finally {
      inFlight.current = false;
    }
  };

/**
 * Coordinates provider-aware subscription management and cancellation.
 */
export function useSubscriptionManagementController(
  subscription: SubscriptionState | null,
): SubscriptionManagementController {
  const analytics = useAnalytics();
  const queryClient = useQueryClient();
  const cancelMutation = useCancelSubscriptionMutation();
  const cancelInFlight = useRef(false);
  const [cancelError, setCancelError] = useState<unknown | null>(null);
  const [managementError, setManagementError] = useState<unknown | null>(null);
  const [isCancelConfirmationOpen, setCancelConfirmationOpen] = useState(false);
  const [lastCanceledSubscription, setLastCanceledSubscription] =
    useState<SubscriptionState | null>(null);
  const managementAction = useMemo(
    () => resolveSubscriptionManagementAction(subscription),
    [subscription],
  );
  const handleManageSubscription = createManageHandler({
    action: managementAction,
    subscription,
    analytics,
    setCancelError,
    setManagementError,
    setConfirmationOpen: setCancelConfirmationOpen,
  });
  const handleCancelSubscription = createCancelHandler({
    action: managementAction,
    subscription,
    analytics,
    queryClient,
    mutation: cancelMutation,
    inFlight: cancelInFlight,
    setError: setCancelError,
    setConfirmationOpen: setCancelConfirmationOpen,
    setCanceledSubscription: setLastCanceledSubscription,
  });

  return {
    isCancelingSubscription: cancelMutation.isPending,
    isCancelConfirmationOpen,
    cancelError,
    managementError,
    lastCanceledSubscription,
    managementAction,
    handleManageSubscription,
    handleCancelSubscription,
    closeCancelConfirmation: () => {
      if (!cancelInFlight.current && !cancelMutation.isPending) {
        cancelMutation.reset();
        setCancelError(null);
        setCancelConfirmationOpen(false);
      }
    },
    dismissManagementError: () => {
      setManagementError(null);
    },
    dismissCancellationFeedback: () => {
      setLastCanceledSubscription(null);
    },
  };
}
