import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";

import { appRoutes } from "@/core/navigation/routes";
import { queryKeys } from "@/core/query/query-keys";

export type CheckoutReturnStatus =
  | "success"
  | "cancel"
  | "pending"
  | "error"
  | "unknown";

export type CheckoutReturnVariant = "success" | "cancel";

export interface CheckoutReturnQueryParams {
  readonly status: CheckoutReturnStatus;
  readonly provider: string | null;
  readonly planSlug: string | null;
  readonly externalReference: string | null;
}

export interface CheckoutReturnController {
  readonly variant: CheckoutReturnVariant;
  readonly query: CheckoutReturnQueryParams;
  readonly handleViewSubscription: () => void;
  readonly handleGoToDashboard: () => void;
  readonly handleRetry: () => void;
}

const SUCCESS_STATUSES: ReadonlySet<string> = new Set([
  "success",
  "paid",
  "approved",
  "confirmed",
]);

const PENDING_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "processing",
  "awaiting",
]);

const CANCEL_STATUSES: ReadonlySet<string> = new Set([
  "cancel",
  "cancelled",
  "canceled",
  "dismiss",
]);

const ERROR_STATUSES: ReadonlySet<string> = new Set(["error", "failed", "failure"]);

const normaliseStatus = (raw: unknown): CheckoutReturnStatus => {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value.length === 0) {
    return "unknown";
  }
  if (SUCCESS_STATUSES.has(value)) {return "success";}
  if (PENDING_STATUSES.has(value)) {return "pending";}
  if (CANCEL_STATUSES.has(value)) {return "cancel";}
  if (ERROR_STATUSES.has(value)) {return "error";}
  return "unknown";
};

const stringOrNull = (raw: unknown): string | null => {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const parseQueryParams = (
  raw: ReturnType<typeof useLocalSearchParams>,
): CheckoutReturnQueryParams => ({
  status: normaliseStatus(raw["status"] ?? raw["checkout_status"] ?? raw["result"]),
  provider: stringOrNull(raw["provider"]),
  planSlug: stringOrNull(raw["plan_slug"] ?? raw["plan"]),
  externalReference: stringOrNull(
    raw["external_reference"] ?? raw["reference"] ?? raw["txid"],
  ),
});

/**
 * Reactive controller for the dedicated checkout return screens.
 *
 * Reads status + provider + plan slug + external reference from the
 * URL, invalidates the subscription/entitlements caches once on mount
 * (success and pending only — cancel/error keep the previous state)
 * so the screen the user lands on next reflects the just-completed
 * payment, and exposes the CTAs the screens render.
 *
 * @param variant Which screen is mounting — informs cache invalidation
 *   and the default outcome shown when the URL has no `status` param.
 * @returns The reactive controller bag.
 */
export const useCheckoutReturnController = (
  variant: CheckoutReturnVariant,
): CheckoutReturnController => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const rawParams = useLocalSearchParams();
  const query = useMemo(() => parseQueryParams(rawParams), [rawParams]);

  useEffect(() => {
    if (variant !== "success" && query.status !== "success" && query.status !== "pending") {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.subscription.root });
    void queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.root });
  }, [queryClient, query.status, variant]);

  const handleViewSubscription = useCallback((): void => {
    router.replace(appRoutes.private.subscription);
  }, [router]);

  const handleGoToDashboard = useCallback((): void => {
    router.replace(appRoutes.private.dashboard);
  }, [router]);

  const handleRetry = useCallback((): void => {
    router.replace(appRoutes.private.subscription);
  }, [router]);

  return {
    variant,
    query,
    handleViewSubscription,
    handleGoToDashboard,
    handleRetry,
  };
};
