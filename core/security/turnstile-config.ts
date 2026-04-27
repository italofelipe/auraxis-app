/**
 * Cloudflare Turnstile site key resolution.
 *
 * The site key is the only public part of the Turnstile setup — the
 * secret key lives on the API. We read from env so production builds
 * can pin a real key while dev / preview builds can run with a
 * Cloudflare test key (`1x00000000000000000000AA`).
 *
 * When no key is configured the helper returns `null` so call sites
 * can fail-soft (skip the challenge in development) rather than
 * rendering a broken WebView.
 */

const TEST_SITE_KEY = "1x00000000000000000000AA" as const;

export interface TurnstilePolicy {
  readonly enabled: boolean;
  readonly siteKey: string | null;
  readonly isTestKey: boolean;
}

const readSiteKey = (): string | null => {
  const raw = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Resolves the active Turnstile policy.
 *
 * @returns Site key + whether it is the Cloudflare test key (used by
 *          UI to surface a small badge in dev so reviewers know the
 *          challenge is mocked).
 */
export const resolveTurnstilePolicy = (): TurnstilePolicy => {
  const siteKey = readSiteKey();
  return {
    enabled: siteKey !== null,
    siteKey,
    isTestKey: siteKey === TEST_SITE_KEY,
  };
};

/**
 * Quick predicate for screens that need to decide between rendering
 * the challenge or skipping it (e.g. `__DEV__` builds without a key).
 */
export const isTurnstileEnabled = (): boolean => {
  return resolveTurnstilePolicy().enabled;
};
