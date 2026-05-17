import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

import { appRouteRegistry, appRoutes } from "@/core/navigation/routes";
import { getAnalyticsClient } from "@/core/observability/analytics-runtime";
import { navigationLogger } from "@/core/telemetry/domain-loggers";
import type { AppLogEntry } from "@/core/telemetry/types";

interface NavigationRouteLogContext {
  readonly route: string;
  readonly routeKey: string;
  readonly access: string;
  readonly tabVisible: boolean;
}

type NavigationRouteLogEntry = AppLogEntry & {
  readonly context: NavigationRouteLogContext;
};

export const normalizePathname = (value: string | null): string => {
  if (!value || value === "/") {
    return appRoutes.root;
  }

  const prefixed = value.startsWith("/") ? value : `/${value}`;
  return prefixed.replace(/\/+$/u, "") || appRoutes.root;
};

export const buildNavigationRouteLogEntry = (
  pathname: string | null,
): NavigationRouteLogEntry => {
  const route = normalizePathname(pathname);
  const routeDefinition = appRouteRegistry.find((entry) => entry.path === route);

  return {
    domain: "navigation",
    event: "navigation.route_changed",
    context: {
      route,
      routeKey: routeDefinition?.key ?? "unknown",
      access: routeDefinition?.access ?? "unknown",
      tabVisible: routeDefinition?.tabVisible ?? false,
    },
  };
};

export const useNavigationTelemetry = (enabled = true): void => {
  const pathname = usePathname();
  const lastLoggedRouteRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const entry = buildNavigationRouteLogEntry(pathname);
    const { route, access, routeKey, tabVisible } = entry.context;
    if (route === lastLoggedRouteRef.current) {
      return;
    }

    navigationLogger.log("navigation.route_changed", {
      context: entry.context,
    });
    getAnalyticsClient().screen(route, {
      access,
      routeKey,
      tabVisible,
    });
    lastLoggedRouteRef.current = route;
  }, [enabled, pathname]);
};
