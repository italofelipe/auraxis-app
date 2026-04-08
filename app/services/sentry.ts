import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import { sanitizeAppUrl } from "@/core/navigation/deep-linking";

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

export function initSentry(): void {
  const dsn = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
  const environment =
    (Constants.expoConfig?.extra?.appEnv as string) ?? "development";

  if (!dsn) {
    if (__DEV__) {
      console.warn("[Sentry] DSN not configured — skipping initialization");
    }
    return;
  }

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
