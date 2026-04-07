import { appRoutes, type AppRoute } from "@/core/navigation/routes";

export interface SessionRouteState {
  readonly hydrated: boolean;
  readonly isAuthenticated: boolean;
}

export interface RouteGuardResult {
  readonly ready: boolean;
  readonly redirectTo: AppRoute | null;
}

export const resolvePrivateRouteGuard = (
  state: SessionRouteState,
): RouteGuardResult => {
  if (!state.hydrated) {
    return {
      ready: false,
      redirectTo: null,
    };
  }

  if (!state.isAuthenticated) {
    return {
      ready: true,
      redirectTo: appRoutes.public.login,
    };
  }

  return {
    ready: true,
    redirectTo: null,
  };
};

export const resolvePublicRouteGuard = (
  state: SessionRouteState,
): RouteGuardResult => {
  if (!state.hydrated) {
    return {
      ready: false,
      redirectTo: null,
    };
  }

  if (state.isAuthenticated) {
    return {
      ready: true,
      redirectTo: appRoutes.private.dashboard,
    };
  }

  return {
    ready: true,
    redirectTo: null,
  };
};

export const resolveRootRoute = (state: SessionRouteState): RouteGuardResult => {
  if (!state.hydrated) {
    return {
      ready: false,
      redirectTo: null,
    };
  }

  return {
    ready: true,
    redirectTo: state.isAuthenticated
      ? appRoutes.private.dashboard
      : appRoutes.public.login,
  };
};
