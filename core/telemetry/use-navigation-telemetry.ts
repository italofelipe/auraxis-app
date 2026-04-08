import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

import { appRouteRegistry, appRoutes } from "@/core/navigation/routes";
import { appLogger } from "@/core/telemetry/app-logger";
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

export const useNavigationTelemetry = (): void => {
  const pathname = usePathname();
  const lastLoggedRouteRef = useRef<string | null>(null);

  useEffect(() => {
    const entry = buildNavigationRouteLogEntry(pathname);
    const route = String(entry.context?.route ?? appRoutes.root);
    if (route === lastLoggedRouteRef.current) {
      return;
    }

    appLogger.info(entry);
    lastLoggedRouteRef.current = route;
  }, [pathname]);
};
