const DEFAULT_WEB_BASE_URL = "https://app.auraxis.com.br";

const resolveWebBaseUrl = (): string => {
  const raw = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? DEFAULT_WEB_BASE_URL;
  return raw.replace(/\/+$/u, "");
};

const WEB_BASE_URL = resolveWebBaseUrl();

export const TERMS_URL = `${WEB_BASE_URL}/termos` as const;
export const PRIVACY_URL = `${WEB_BASE_URL}/privacidade` as const;
export const PLANS_URL = `${WEB_BASE_URL}/planos` as const;
export const MANAGE_SUBSCRIPTION_URL = `${WEB_BASE_URL}/conta/assinatura` as const;
