import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { queryKeys } from "@/core/query/query-keys";

/**
 * Listens for AppState changes and revalidates the subscription and
 * entitlements queries whenever the app comes back to the foreground.
 *
 * This is the canonical hook to mount once inside the authenticated layout
 * so we always reconcile billing/entitlement state after the user returns
 * from the hosted checkout (or any external redirect such as the password
 * reset link).
 */
export function useEntitlementsForegroundRefresh(): void {
  const queryClient = useQueryClient();
  const lastStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleChange = (next: AppStateStatus) => {
      const previous = lastStateRef.current;
      lastStateRef.current = next;

      if (next !== "active") {
        return;
      }
      if (previous === "active") {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.subscription.root });
      void queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.root });
    };

    const subscription = AppState.addEventListener("change", handleChange);
    return () => {
      subscription.remove();
    };
  }, [queryClient]);
}
