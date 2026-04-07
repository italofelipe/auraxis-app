import type { RedirectProps } from "expo-router";

import {
  resolvePrivateRouteGuard,
  resolvePublicRouteGuard,
  resolveRootRoute,
} from "@/core/navigation/route-guards";
import { useSessionStore } from "@/core/session/session-store";

export interface RouteGuardHookResult {
  readonly ready: boolean;
  readonly redirectTo: RedirectProps["href"] | null;
}

const useRouteState = (): {
  readonly hydrated: boolean;
  readonly isAuthenticated: boolean;
} => {
  const hydrated = useSessionStore((state) => state.hydrated);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);

  return {
    hydrated,
    isAuthenticated,
  };
};

export const usePrivateRouteGuard = (): RouteGuardHookResult => {
  return resolvePrivateRouteGuard(useRouteState());
};

export const usePublicRouteGuard = (): RouteGuardHookResult => {
  return resolvePublicRouteGuard(useRouteState());
};

export const useRootRouteGuard = (): RouteGuardHookResult => {
  return resolveRootRoute(useRouteState());
};
