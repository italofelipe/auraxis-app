/**
 * SSL pinning scaffolding for the Auraxis app.
 *
 * Posture today:
 * - Runtime config exposes `sslPinningEnabled` and a list of expected
 *   SHA-256 fingerprints. Both are read from env so production builds
 *   can enable pinning without an OTA being able to disable it
 *   (`EXPO_PUBLIC_SSL_PINNING_ENABLED` is set at build time).
 * - This module owns the canonical "should pinning enforce now?"
 *   decision so call sites never have to assemble the predicate.
 *
 * Native enforcement (Android networkSecurityConfig + iOS ATS) lands
 * in a follow-up release that ties the certificate fingerprint to the
 * production deploy. Until then, the helper still returns a coherent
 * snapshot that future axios / fetch adapters can call into without
 * reshaping their wiring.
 */

interface RawEnvSnapshot {
  readonly enabled: string | undefined;
  readonly fingerprints: string | undefined;
}

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
   * Expected SHA-256 fingerprints, in the form
   * `sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`.
   * Two are recommended (current + next) so a certificate roll
   * does not cause a forced app update.
   */
  readonly expectedFingerprints: readonly string[];
}

/**
 * Resolves the active SSL pinning policy from runtime env. Returns a
 * disabled policy when the flag is off or no fingerprints are
 * configured — the caller decides whether to fail-closed.
 */
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
