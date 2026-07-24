const DEFAULT_WEB_BASE_URL = "https://app.auraxis.com.br";

const resolveWebBaseUrl = (): string => {
  const raw = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? DEFAULT_WEB_BASE_URL;
  return raw.replace(/\/+$/u, "");
};

const WEB_BASE_URL = resolveWebBaseUrl();

export const PLANS_URL = `${WEB_BASE_URL}/plans` as const;
export const MANAGE_SUBSCRIPTION_URL = `${WEB_BASE_URL}/subscription` as const;
export const APPLE_SUBSCRIPTIONS_URL =
  "https://apps.apple.com/account/subscriptions" as const;
export const GOOGLE_PLAY_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions" as const;
