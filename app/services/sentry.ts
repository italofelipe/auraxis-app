import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

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
      // Strip any PII that might leak through
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
}
