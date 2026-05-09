/**
 * SSL pinning policy + defensive runtime helpers for the Auraxis app.
 *
 * Two-layer enforcement:
 *
 * 1. **Native (primary)** — pins live in the native build:
 *    - iOS: `app.json ios.infoPlist.NSAppTransportSecurity.NSPinnedDomains`
 *      (`NSIncludesSubdomains` + `NSPinnedCAIdentities`).
 *    - Android: `assets/network-security-config.xml`
 *      (`<domain-config>` + `<pin-set>` per host).
 *    The OS/framework rejects mismatched certificates during the TLS
 *    handshake, before any JS runs. JS cannot opt out — pinning is
 *    immutable for the installed binary until the next store update.
 *
 * 2. **Defensive (this module)** — runtime predicates the HTTP layer
 *    can call to ensure outbound requests target the canonical
 *    `*.auraxis.com.br` envelope and use HTTPS. This catches developer
 *    errors (typos, dev-only bypass URLs, http://) before they reach
 *    the network — a small belt-and-braces step on top of the native
 *    layer.
 *
 * The runtime config (`EXPO_PUBLIC_SSL_PINNING_ENABLED` +
 * `EXPO_PUBLIC_SSL_PINNING_FINGERPRINTS`) is preserved for two
 * purposes:
 *
 * - Telemetry / observability: ops dashboards check whether the
 *   build was promoted with pinning intent.
 * - Future native bridge: if we ever adopt a native pinning library
 *   that consumes JS-side pin hashes, the same policy plumbing
 *   already exists.
 *
 * Native enforcement IS active when the build ships; do not confuse
 * "policy disabled" (env flag off) with "no pinning". The flag only
 * controls this defensive module's posture.
 */

interface RawEnvSnapshot {
  readonly enabled: string | undefined;
  readonly fingerprints: string | undefined;
}

const CANONICAL_HOST_SUFFIX = ".auraxis.com.br";
const ROOT_HOST = "auraxis.com.br";

const readEnv = (): RawEnvSnapshot => {
  return {
    enabled: process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED,
    fingerprints: process.env.EXPO_PUBLIC_SSL_PINNING_FINGERPRINTS,
  };
};

const parseEnabled = (raw: string | undefined): boolean => {
  if (!raw) {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on";
};

const parseFingerprints = (raw: string | undefined): readonly string[] => {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export interface SslPinningPolicy {
  readonly enabled: boolean;
  /**
   * Expected SHA-256 SPKI fingerprints, in the form
   * `sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`. These
   * mirror the native pin sets (iOS `NSPinnedCAIdentities`, Android
   * `<pin>`) and exist for telemetry parity. Two are recommended
   * (current + next) so a certificate roll does not require a forced
   * app update.
   */
  readonly expectedFingerprints: readonly string[];
}

export const resolveSslPinningPolicy = (): SslPinningPolicy => {
  const env = readEnv();
  const enabled = parseEnabled(env.enabled);
  const fingerprints = parseFingerprints(env.fingerprints);

  return {
    enabled: enabled && fingerprints.length > 0,
    expectedFingerprints: fingerprints,
  };
};

/**
 * Quick predicate for runtime branches. Equivalent to
 * `resolveSslPinningPolicy().enabled` but cheaper to read at call
 * sites that only need the boolean.
 */
export const isSslPinningEnforced = (): boolean => {
  return resolveSslPinningPolicy().enabled;
};

export type RequestVerdict =
  | { readonly kind: "ok" }
  | { readonly kind: "blocked"; readonly reason: BlockedReason };

export type BlockedReason =
  | "non_https_scheme"
  | "non_canonical_host"
  | "invalid_url";

const isCanonicalHost = (hostname: string): boolean => {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === ROOT_HOST || normalized.endsWith(CANONICAL_HOST_SUFFIX)
  );
};

/**
 * Validates that an outbound request URL targets the canonical
 * `*.auraxis.com.br` envelope and uses HTTPS. Returns a discriminated
 * verdict so callers (HTTP client interceptor, fetch wrapper) can
 * react appropriately — typically blocking the request and reporting
 * to telemetry.
 *
 * This is a JS-side defensive check; native pinning is the primary
 * line of defense and runs unconditionally during the TLS handshake.
 */
export const verifyCanonicalRequest = (rawUrl: string): RequestVerdict => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { kind: "blocked", reason: "invalid_url" };
  }
  if (parsed.protocol !== "https:") {
    return { kind: "blocked", reason: "non_https_scheme" };
  }
  if (!isCanonicalHost(parsed.hostname)) {
    return { kind: "blocked", reason: "non_canonical_host" };
  }
  return { kind: "ok" };
};
