import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

import { appRouteRegistry, appRoutes } from "@/core/navigation/routes";
import { getAnalyticsClient } from "@/core/observability/analytics-runtime";
import { navigationLogger } from "@/core/telemetry/domain-loggers";
import type { AppLogEntry } from "@/core/telemetry/types";

export const normalizePathname = (value: string | null): string => {
  if (!value || value === "/") {
    return appRoutes.root;
  }

  const prefixed = value.startsWith("/") ? value : `/${value}`;
  return prefixed.replace(/\/+$/u, "") || appRoutes.root;
};

export const buildNavigationRouteLogEntry = (
  pathname: string | null,
): AppLogEntry => {
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
    const route = String(entry.context?.route ?? appRoutes.root);
    if (route === lastLoggedRouteRef.current) {
      return;
    }

    navigationLogger.log("navigation.route_changed", {
      context: entry.context,
    });
    getAnalyticsClient().screen(route, {
      access: String(entry.context?.access ?? "unknown"),
      routeKey: String(entry.context?.routeKey ?? "unknown"),
      tabVisible: Boolean(entry.context?.tabVisible ?? false),
    });
    lastLoggedRouteRef.current = route;
  }, [enabled, pathname]);
};
