import {
  appRoutes,
  appRouteRegistry,
  isLegalAppRoute,
  isPrivateAppRoute,
  isPublicAppRoute,
  type AppRoute,
  type PrivateAppRoute,
} from "@/core/navigation/routes";
import { navigationLogger } from "@/core/telemetry/domain-loggers";
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

export const ALLOWED_DEEP_LINK_PATHS: readonly AppRoute[] = Object.freeze(
  appRouteRegistry.map((route) => route.path),
);

const ALLOWED_DEEP_LINK_PATH_SET = new Set<AppRoute>(ALLOWED_DEEP_LINK_PATHS);
const TRUSTED_UNIVERSAL_LINK_HOSTS = new Set(["auraxis.app", "www.auraxis.app"]);

const isAllowedDeepLinkPath = (path: string): path is AppRoute => {
  return ALLOWED_DEEP_LINK_PATH_SET.has(path as AppRoute);
};

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
  const isAppScheme = url.protocol === `${appRuntimeConfig.appScheme}:`;

  if (isAppScheme && url.host.length > 0) {
    if (pathname === appRoutes.root) {
      return normalizeRoutePath(url.host);
    }
    return normalizeRoutePath(`${url.host}${pathname}`);
  }

  return pathname;
};

const isTrustedIncomingUrl = (url: URL): boolean => {
  if (url.protocol === `${appRuntimeConfig.appScheme}:`) {
    return true;
  }

  if (url.protocol !== "https:") {
    return false;
  }

  return TRUSTED_UNIVERSAL_LINK_HOSTS.has(url.hostname.toLowerCase());
};

const readQueryValue = (
  searchParams: URLSearchParams,
  key: string,
): QueryValue => {
  const value = searchParams.get(key);
  return typeof value === "string" && value.length > 0 ? value : null;
};

const SENSITIVE_QUERY_KEY_PATTERN =
  /(^|[_-])(token|secret|password|email|authorization|auth|jwt|api[-_]?key|code)([_-]|$)/iu;

const shouldRedactQueryKey = (key: string): boolean => {
  return SENSITIVE_QUERY_KEY_PATTERN.test(key);
};

export const sanitizeAppUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);

    for (const key of [...url.searchParams.keys()]) {
      if (shouldRedactQueryKey(key)) {
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
    path === appRoutes.private.checkoutSuccess ||
    path === appRoutes.private.checkoutCancel ||
    path === configuredCheckoutReturnPath
  );
};

const inferStatusFromPath = (path: string): string | null => {
  if (path === appRoutes.private.checkoutSuccess) {
    return "success";
  }
  if (path === appRoutes.private.checkoutCancel) {
    return "cancel";
  }
  return null;
};

const buildCheckoutReturnIntent = (
  rawUrl: string,
  href: PrivateAppRoute,
  searchParams: URLSearchParams,
): CheckoutReturnIntent => {
  const rawStatus =
    readQueryValue(searchParams, "checkout_status") ??
    readQueryValue(searchParams, "status") ??
    readQueryValue(searchParams, "result") ??
    inferStatusFromPath(href);

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

/**
 * Parses an external URL into a typed `AppLinkIntent` that the
 * navigation layer can act on safely.
 *
 * Allowlist contract: a URL is only resolved when its pathname matches
 * one of the registered private or public routes (or a known checkout
 * return). Anything outside that set returns `null` and emits a
 * `deeplink.rejected` structured event so security monitoring can see
 * malicious or stale link attempts. Query parameters with sensitive
 * keys are always redacted from the logged URL.
 *
 * @param rawUrl Raw URL captured from the deep-link / universal-link
 *               handler, the OS share sheet, or a notification tap.
 * @returns Parsed intent, or `null` for any URL outside the allowlist.
 */
export const parseAppUrl = (rawUrl: string): AppLinkIntent | null => {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    navigationLogger.log("navigation.deep_link_parse_failed", {
      level: "warn",
      context: { rawUrl: sanitizeAppUrl(rawUrl) },
    });
    return null;
  }

  if (!isTrustedIncomingUrl(url)) {
    navigationLogger.log("navigation.deep_link_rejected", {
      level: "warn",
      context: {
        rawUrl: sanitizeAppUrl(rawUrl),
        path: normalizeRoutePath(url.pathname),
        reason: "untrusted_scheme_or_host",
      },
    });
    return null;
  }

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

  if (
    isAllowedDeepLinkPath(path) ||
    isPrivateAppRoute(path) ||
    isPublicAppRoute(path) ||
    isLegalAppRoute(path)
  ) {
    return {
      kind: "route",
      href: path,
      rawUrl: sanitizeAppUrl(rawUrl),
    };
  }

  navigationLogger.log("navigation.deep_link_rejected", {
    level: "warn",
    context: {
      rawUrl: sanitizeAppUrl(rawUrl),
      path,
      reason: "path_not_in_allowlist",
    },
  });
  return null;
};

export const resolveDeepLinkFallbackRoute = (
  isAuthenticated: boolean,
): PrivateAppRoute | (typeof appRoutes.public.login) => {
  return isAuthenticated ? appRoutes.private.dashboard : appRoutes.public.login;
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
