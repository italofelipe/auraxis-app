import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import { sanitizeAppUrl } from "@/core/navigation/deep-linking";
import { sanitizeTelemetryContext } from "@/core/telemetry/sanitization";
import type { SentryOperationalContext } from "@/core/telemetry/operational-context";
import type { AppBreadcrumb } from "@/core/telemetry/types";

let sentryEnabled = false;

const isJestRuntime = (): boolean => {
  return typeof process !== "undefined" && Boolean(process.env.JEST_WORKER_ID);
};

const redactHeaderValue = (
  headers: Record<string, unknown> | undefined,
  key: string,
): void => {
  if (!headers) {
    return;
  }

  if (key in headers) {
    headers[key] = "<redacted>";
  }

  const lowerCaseKey = key.toLowerCase();
  if (lowerCaseKey in headers) {
    headers[lowerCaseKey] = "<redacted>";
  }
};

export const sanitizeSentryEvent = <T extends Sentry.Event>(event: T): T => {
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }

  if (event.request?.url) {
    event.request.url = sanitizeAppUrl(event.request.url);
  }

  if (event.request?.headers) {
    redactHeaderValue(event.request.headers, "Authorization");
    redactHeaderValue(event.request.headers, "X-Observability-Key");
    redactHeaderValue(event.request.headers, "Cookie");
  }

  return event;
};

export const resetSentryRuntimeForTests = (): void => {
  sentryEnabled = false;
};

export const recordSentryBreadcrumb = (breadcrumb: AppBreadcrumb): void => {
  if (!sentryEnabled) {
    return;
  }

  const level = breadcrumb.level === "warn" ? "warning" : breadcrumb.level;

  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level,
    data: sanitizeTelemetryContext(breadcrumb.data),
  });
};

export const captureSentryException = (error: unknown): void => {
  if (!sentryEnabled) {
    return;
  }

  Sentry.captureException(error);
};

const setSentryTagIfPresent = (key: string, value: unknown): void => {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    return;
  }

  Sentry.setTag(key, String(value));
};

export const syncSentryOperationalContext = (
  context: SentryOperationalContext,
): void => {
  if (!sentryEnabled) {
    return;
  }

  const release = sanitizeTelemetryContext(context.release);
  const runtime = sanitizeTelemetryContext(context.runtime);
  const session = sanitizeTelemetryContext(context.session);

  Sentry.setContext("release", release ?? {});
  Sentry.setContext("runtime", runtime ?? {});
  Sentry.setContext("session", session ?? {});
  setSentryTagIfPresent("app_env", release?.appEnv);
  setSentryTagIfPresent("app_version", release?.appVersion);
  setSentryTagIfPresent("platform", release?.platform);
  setSentryTagIfPresent("api_mode", release?.apiMode);
  setSentryTagIfPresent("authenticated", session?.authenticated);
  setSentryTagIfPresent("connectivity_status", runtime?.connectivityStatus);
};

export function initSentry(): void {
  const dsn = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
  const environment =
    (Constants.expoConfig?.extra?.appEnv as string) ?? "development";

  if (!dsn) {
    sentryEnabled = false;
    if (__DEV__ && !isJestRuntime()) {
      console.warn("[Sentry] DSN not configured — skipping initialization");
    }
    return;
  }

  sentryEnabled = true;
  Sentry.init({
    dsn,
    environment,
    enabled: !__DEV__, // only in production builds
    tracesSampleRate: 0.2,
    _experiments: { profilesSampleRate: 0.1 },
    sendDefaultPii: false, // LGPD compliance
    beforeSend(event) {
      return sanitizeSentryEvent(event);
    },
  });
}
