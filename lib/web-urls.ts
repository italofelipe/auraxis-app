const DEFAULT_WEB_BASE_URL = "https://app.auraxis.com.br";

const resolveWebBaseUrl = (): string => {
  const raw = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? DEFAULT_WEB_BASE_URL;
  return raw.replace(/\/+$/u, "");
};

const WEB_BASE_URL = resolveWebBaseUrl();

/** Canonical URL for the Terms of Use page. */
export const TERMS_URL = `${WEB_BASE_URL}/termos` as const;

/** Canonical URL for the Privacy Policy page. */
export const PRIVACY_URL = `${WEB_BASE_URL}/privacidade` as const;
