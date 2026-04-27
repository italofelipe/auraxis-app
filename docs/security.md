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
- Application of the gate to specific flows (account deletion,
  password change, checkout) ships incrementally per epic — see
  `#298` follow-ups and `#304`.

## Active scaffolding

### SSL pinning (not yet enforcing)
- `core/security/ssl-pinning.ts` exposes `resolveSslPinningPolicy()`
  and `isSslPinningEnforced()` reading from
  `EXPO_PUBLIC_SSL_PINNING_ENABLED` and
  `EXPO_PUBLIC_SSL_PINNING_FINGERPRINTS`.
- The flag stays **off** in current builds because production
  certificate fingerprints are not yet pinned at the native layer
  (Android `networkSecurityConfig`, iOS ATS dictionary).
- Two SHA-256 fingerprints are recommended (current + next) so a
  certificate roll never bricks installed clients.
- Enabling for real lands together with a deploy that ties the
  fingerprint to the current ACM certificate. Tracked in `#298`.

## Out of scope here (links)

- **Backend session and refresh contracts** — see `auraxis-api`.
- **Frontend (web) security headers and CSP** — see `auraxis-web`.
- **CAPTCHA on login / register** — paridade com web ainda pendente
  no app; tracking em `#298` (Cloudflare Turnstile via WebView).
- **Penetration test cadence** — owned by platform `.context/`.
