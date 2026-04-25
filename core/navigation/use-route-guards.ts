import { usePathname, type RedirectProps } from "expo-router";
import { useEffect } from "react";

import { useAuthRedirectStore } from "@/core/navigation/auth-redirect-context";
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
  const pathname = usePathname();
  const captureRedirect = useAuthRedirectStore((state) => state.capture);
  const result = resolvePrivateRouteGuard(useRouteState());

  useEffect(() => {
    if (result.redirectTo === null) {
      return;
    }
    captureRedirect(pathname);
  }, [result.redirectTo, pathname, captureRedirect]);

  return result;
};

export const usePublicRouteGuard = (): RouteGuardHookResult => {
  return resolvePublicRouteGuard(useRouteState());
};

export const useRootRouteGuard = (): RouteGuardHookResult => {
  return resolveRootRoute(useRouteState());
};
