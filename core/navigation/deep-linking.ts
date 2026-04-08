import {
  appRoutes,
  isPrivateAppRoute,
  isPublicAppRoute,
  type AppRoute,
  type PrivateAppRoute,
} from "@/core/navigation/routes";
import { appRuntimeConfig } from "@/shared/config/runtime";

export type CheckoutReturnStatus =
  | "success"
  | "pending"
  | "cancel"
  | "error"
  | "unknown";

export interface RouteLinkIntent {
  readonly kind: "route";
  readonly href: AppRoute;
  readonly rawUrl: string;
}

export interface CheckoutReturnIntent {
  readonly kind: "checkout-return";
  readonly href: PrivateAppRoute;
  readonly rawUrl: string;
  readonly status: CheckoutReturnStatus;
  readonly provider: string | null;
  readonly planSlug: string | null;
  readonly externalReference: string | null;
}

export type AppLinkIntent = RouteLinkIntent | CheckoutReturnIntent;

type QueryValue = string | null;

const normalizeRoutePath = (path: string): string => {
  if (path.length === 0 || path === "/") {
    return appRoutes.root;
  }

  const prefixed = path.startsWith("/") ? path : `/${path}`;
  return prefixed.replace(/\/+$/u, "") || appRoutes.root;
};

const configuredCheckoutReturnPath = normalizeRoutePath(
  appRuntimeConfig.checkoutReturnPath,
);

const resolveUrlPath = (url: URL): string => {
  const pathname = normalizeRoutePath(url.pathname);

  if (pathname !== appRoutes.root) {
    return pathname;
  }

  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:" &&
    url.host.length > 0
  ) {
    return normalizeRoutePath(url.host);
  }

  return pathname;
};

const readQueryValue = (
  searchParams: URLSearchParams,
  key: string,
): QueryValue => {
  const value = searchParams.get(key);
  return typeof value === "string" && value.length > 0 ? value : null;
};

const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "checkout_token",
  "access_token",
  "refresh_token",
]);

export const sanitizeAppUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);

    for (const key of SENSITIVE_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, "<redacted>");
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
};

const normalizeCheckoutStatus = (
  rawStatus: string | null,
): CheckoutReturnStatus => {
  const normalized = String(rawStatus ?? "").trim().toLowerCase();

  if (["success", "paid", "approved", "confirmed"].includes(normalized)) {
    return "success";
  }

  if (["pending", "processing", "awaiting"].includes(normalized)) {
    return "pending";
  }

  if (["cancel", "cancelled", "canceled", "dismiss"].includes(normalized)) {
    return "cancel";
  }

  if (["error", "failed", "failure"].includes(normalized)) {
    return "error";
  }

  return "unknown";
};

const isCheckoutReturnPath = (path: string): path is PrivateAppRoute => {
  return (
    path === appRoutes.private.subscription ||
    path === configuredCheckoutReturnPath
  );
};

const buildCheckoutReturnIntent = (
  rawUrl: string,
  href: PrivateAppRoute,
  searchParams: URLSearchParams,
): CheckoutReturnIntent => {
  const rawStatus =
    readQueryValue(searchParams, "checkout_status") ??
    readQueryValue(searchParams, "status") ??
    readQueryValue(searchParams, "result");

  return {
    kind: "checkout-return",
    href,
    rawUrl: sanitizeAppUrl(rawUrl),
    status: normalizeCheckoutStatus(rawStatus),
    provider: readQueryValue(searchParams, "provider"),
    planSlug:
      readQueryValue(searchParams, "plan_slug") ??
      readQueryValue(searchParams, "plan"),
    externalReference:
      readQueryValue(searchParams, "external_reference") ??
      readQueryValue(searchParams, "reference"),
  };
};

export const parseAppUrl = (rawUrl: string): AppLinkIntent | null => {
  try {
    const url = new URL(rawUrl);
    const path = resolveUrlPath(url);

    if (path === appRoutes.root) {
      return {
        kind: "route",
        href: appRoutes.root,
        rawUrl: sanitizeAppUrl(rawUrl),
      };
    }

    if (isCheckoutReturnPath(path)) {
      return buildCheckoutReturnIntent(rawUrl, path, url.searchParams);
    }

    if (isPrivateAppRoute(path) || isPublicAppRoute(path)) {
      return {
        kind: "route",
        href: path,
        rawUrl: sanitizeAppUrl(rawUrl),
      };
    }

    return null;
  } catch {
    return null;
  }
};

export const buildAppUrl = (
  route: AppRoute,
  query: Record<string, string> = {},
): string => {
  const path = route === appRoutes.root ? "" : route.replace(/^\/+/u, "");
  const base = `${appRuntimeConfig.appScheme}://${path}`;
  const search = new URLSearchParams(query).toString();
  return search.length > 0 ? `${base}?${search}` : base;
};

export const buildCheckoutReturnUrl = (): string => {
  const path = configuredCheckoutReturnPath.replace(/^\/+/u, "");
  const base = `${appRuntimeConfig.appScheme}://${path}`;
  return `${base}?checkout_return=1`;
};
