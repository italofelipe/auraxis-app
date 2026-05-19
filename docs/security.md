# Auraxis App — Security Posture

This document captures the security primitives the mobile app ships
with today and the deliberate gaps that are tracked separately. It is
intentionally short — for the broader incident-response and SDLC
posture see `auraxis-platform/.context/`.

## Active controls

### Session and tokens
- Access + refresh tokens persisted in `expo-secure-store` (Keychain
  on iOS, Keystore-backed EncryptedSharedPreferences on Android).
- `useSessionStore.rotateTokens(access, refresh, expiresAt?)` writes
  the pair atomically; the storage layer never observes a half-rolled
  refresh state.
- 401 / 403 responses run through `invalidateSession()` and tear down
  the session immediately.

### Telemetry hygiene
- All breadcrumbs and structured events route through
  `core/telemetry/` with PII sanitisation depth 4 (recursive redact
  of `email`, `token`, `password`, `cpf`, `ip`, etc.).
- Sentry events have `sendDefaultPii: false` and explicitly delete
  `user.email` and `user.ip_address` before transmission.

### Deep linking
- `core/navigation/deep-linking.ts` accepts only paths in the static
  route registry (`isPrivateAppRoute` + `isPublicAppRoute`).
- Rejected paths emit `navigation.deep_link_rejected` (warn) so
  monitoring can distinguish legitimate user mistakes from probing.
- Sensitive query params (`token`, `secret`, `password`, `email`,
  `code`, ...) are redacted before any value reaches the logger.

### Device integrity
- `core/security/integrity-check.ts` runs once per app launch via
  `runDeviceIntegrityCheck()` (wired in `useAppStartup`).
- Strong signals (jailbreak, debugger attached in release, hooking
  framework detected) flag the device as `compromised` and emit a
  Sentry warning with `device.compromised: true`.
- Weak signals (mock location, external storage on Android) are
  recorded but do not flip the status alone.
- Compromised devices are **not blocked**. Rooted devices may be
  legitimate developer / power-user contexts; locking them out has
  poor signal-to-noise. The control is monitoring, not enforcement.

### Biometric gate
- `core/security/biometric-gate.ts` wraps `expo-local-authentication`.
- `inspectBiometricSupport()` and `requestBiometricAuth()` return
  discriminated outcomes; neither ever throws to its caller.
- User-facing toggle lives in **Profile → Security**. When the device
  reports unsupported / not-enrolled, the toggle disables itself with
  helper copy explaining why.
- Mandatory gates currently cover account deletion and checkout
  finalization. Both pass `biometricsOnly: true`, so the OS credential
  fallback cannot authorize these sensitive actions.
- Sensitive flows that pass `biometricsOnly: true` reject
  `fallback_pin` and require a real biometric match.
- Password change does not have an authenticated in-app flow yet. When
  that screen lands, it must call
  `useBiometricGate({ required: true, biometricsOnly: true })` before
  submitting the mutation.

### CAPTCHA
- Login and registration render the Cloudflare Turnstile challenge when
  `EXPO_PUBLIC_TURNSTILE_SITE_KEY` is configured.
- The auth service sends the resulting token as `captcha_token`, aligned
  with the backend contract and web parity.

## Native/runtime controls

### SSL pinning (native pins active)
- `core/security/ssl-pinning.ts` exposes `resolveSslPinningPolicy()`
  and `isSslPinningEnforced()` reading from
  `EXPO_PUBLIC_SSL_PINNING_ENABLED` and
  `EXPO_PUBLIC_SSL_PINNING_FINGERPRINTS`.
- Native pinning is configured for `api.auraxis.com.br` in `app.json`
  and `assets/network-security-config.xml`.
- Current production pins:
  - Leaf `api.auraxis.com.br`: `sha256/6ZqZa5LRfTimLYEkGrZ9Pja4ku36AtNGVJ9NbD13GgI=`
  - Backup CA/intermediate `Let's Encrypt E7`: `sha256/y7xVm0TVJNahMr2sZydE2jQH8SquXV9yLF9seROHHHU=`
- The runtime policy only reports `enabled=true` when the build exposes
  at least two distinct fingerprints.
- Before promoting beyond internal beta, run the MITM smoke in the SSL
  pinning rotation runbook on both preview devices.

## Out of scope here (links)

- **Backend session and refresh contracts** — see `auraxis-api`.
- **Frontend (web) security headers and CSP** — see `auraxis-web`.
- **CAPTCHA provider/key changes** — Cloudflare Turnstile is active in
  the auth forms; provider/key changes remain tracked in `#298`.
- **MITM smoke** — tracked in `#298` and the SSL pinning rotation
  runbook before promoting beyond internal beta.
- **Penetration test cadence** — owned by platform `.context/`.
