# Auraxis App Architecture

## Scope

Auraxis App is the Expo/React Native client for logged-in Auraxis product flows. It uses Expo Router routes under `app/`, feature modules under `features/`, shared UI/runtime primitives under `shared/` and `core/`, and local feature flag metadata in `config/feature-flags.json`.

## Feature Modules

- Product screens live in `features/<domain>/screens` and are mounted by thin route files in `app/(private)` or `app/(public)`.
- Pure financial calculators live in `features/tools/services/calculators`. They must stay deterministic, side-effect free, and covered by unit tests before screen wiring.
- Calculator screens use `features/tools/components/calculator-screen.tsx` when the input/result flow fits the shared form/result/save pattern.
- Saved simulations continue through `useSaveSimulationMutation`; adding a local calculator does not imply a backend or database contract change.

## Web Parity Additions

- `Custo de vida regional` is implemented as a private premium app tool with route `/custo-de-vida-regional`.
- Its regional seed data is mirrored in `features/tools/data/cost-of-living-by-uf.json` so the app calculator runs locally and does not depend on the Web repo at runtime.
- The calculator compares monthly expenses against UF averages, computes committed income, savings rate, FIRE target wealth, estimated years to retirement, regional comparison and a sustainability score.

## AI Financial Chat

- `AiChatHost` is mounted once by `app/(private)/_layout.tsx`. Its floating launcher is therefore available from every authenticated tab without adding a route or mounting the feature before the private route guard succeeds.
- `app.features.ai-chat` is the app kill switch. The entitlement query is disabled when the flag is off, so disabling the surface also prevents background access checks.
- The canonical commercial gate is the API entitlement `advanced_simulations`. The app uses it only to avoid a known 403; it never duplicates plan/status rules or the backend daily quota.
- `features/ai-chat/services/ai-chat-service.ts` owns the typed `POST /ai/chat` adapter, trims and validates the 1–1,000 character question contract, maps the v2 envelope to camelCase and applies a 45-second request timeout suitable for an LLM response.
- The API remains single-turn and stateless. `useAiChatSession` keeps the transcript in private-layout memory, preserves it when the sheet closes and clears it naturally when logout unmounts the private shell.
- `useAiInsightConsent` now treats `GET/POST /me/consents` as the consent authority (`kind=ai`, `version=1.0`, `source=app`). SecureStore is only a resilience cache when the remote read is unavailable.
- Sensitive preview state goes through `core/storage/secure-key-value-storage.ts`: iOS/Android keep Expo SecureStore, while Expo Web uses process-memory storage only and never writes tokens or consent to `localStorage`.
- A stale local consent cannot silently overwrite an explicit server revocation: a successful remote read wins and clears the local cache when AI consent is absent/revoked.
- Error taxonomy keeps entitlement, consent, budget, validation, timeout and server failures distinct. Retry is offered only for transient timeout/server failures; renewing a rejected consent automatically retries the pending question without duplicating the user message.
- Product analytics record only gate state, attempt type, classified error and boolean response metadata. Questions, answers, model, tokens, cost and financial values are never captured.
- The screen structure, parity decisions, API contract and iOS/Android smoke plan are documented in `docs/wiki/mobile-ai-financial-chat-2026-07-24.md`.
- Modal content forces the resolved Tamagui theme inside the portal. `AppButton` resolves its semantic colors to concrete values, preserving the same CTA appearance when a portal cannot inherit generated theme variables.

## Transactions Surface

- Mobile transactions keep `description` as the legacy short detail field and now expose `observation` as the dedicated optional notes field already present in the app API contract.
- `TransactionForm` edits both fields independently; `useTransactionsScreenController` forwards `observation` through create, update and duplicate flows without introducing a new endpoint.
- The feed view-model and action sheet render observations as a separate detail block so historical descriptions remain visible and untouched.

## Subscription Management

- `/assinatura` remains the canonical private mobile route and composes subscription state, plan catalog, checkout, trial and management in `SubscriptionScreen`.
- `useSubscriptionManagementController` isolates cancellation side effects from the screen/checkout controller. It calls the existing `POST /subscriptions/cancel` mutation, writes the returned subscription into the canonical query cache and invalidates both `subscription` and `entitlements`.
- `subscription-management.ts` resolves the management owner from the API `provider`: `asaas`, `stub` and provider-less trials use the Auraxis API; Apple and Google providers open their official store management centers; unknown providers fall back to the canonical Web route `/subscription`.
- API-managed cancellation requires an explicit confirmation sheet, blocks concurrent submissions with a synchronous in-flight guard and preserves the confirmed access-end date returned by the backend.
- Store-managed subscriptions never call the Auraxis cancellation endpoint. The store remains responsible for confirmation, renewal and cancellation.
- The provider matrix, recovery behavior and iOS/Android smoke procedure are documented in `docs/wiki/subscription-management-and-cancellation-2026-07-23.md`.

## Shared Entries Surface

- `/compartilhamentos` mounts `SharedEntriesScreen`, guarded by `PaywallGate` for the `shared_entries` entitlement.
- `useSharedEntriesScreenController` keeps the Web parity split explicit: incoming invitations, entries shared by the current user (`byMe`), entries shared with the current user (`withMe`) and outgoing invitations are queried/classified independently.
- The mobile surface renders a summary card with total entries, active entries and pending invitations before the tab selector, then shows per-tab counters so `Compartilhei` and `Recebi` stay visually distinct.
- `Compartilhei` includes the outgoing composer, the list of shares created by the user and the sent invitation list. Pending sent invitations can be revoked through the same generated `/shared-entries/invitations/{invitationId}` contract used by incoming rejection.
- Shared-entry revocation remains restricted to `byMe` cards; `withMe` cards are read-only and keep the explanatory copy that only the creator can revoke.

## Feature Flags

- `app.transactions.installments` is promoted to `enabled-prod` after app-side parity validation for transaction installments.
- `app.credit-cards.expense-actions` is promoted to `enabled-prod` after app-side parity validation for edit, duplicate and delete actions in credit card invoices.
- `app.features.ai-chat` controls the global Premium financial assistant and is independently overridable for an immediate OTA kill switch.
- Local flag status is tested through `shared/feature-flags/service.test.ts`; runtime providers can still override decisions where configured.

## Runtime Security

- `shared/config/runtime.ts` is the canonical resolver for public Expo runtime configuration used by HTTP, telemetry and product services.
- Production runtime (`EXPO_PUBLIC_APP_ENV=production`) must resolve `EXPO_PUBLIC_API_URL` to a valid HTTPS URL and must never fall back to localhost. The guard runs while `appRuntimeConfig` is created, before the app can build an HTTP client against an unsafe base URL.
- Development and preview builds can still use localhost for Expo Go/dev-client workflows.
- Tamagui `size` and `space` tokens expose a `true` alias matching the default `40`/`semanticSpacing.md` values required by the current runtime.
- Native TLS trust for `api.auraxis.com.br` is CA-SPKI based on both platforms. iOS reads the CA identities from `app.json`; Android receives the equivalent `network_security_config.xml` through `plugins/with-android-network-security-config.cjs` during Expo prebuild.
- Leaf and CA identities must not be mixed in the iOS pinned domain. Apple evaluates both configured categories, so a routine leaf-certificate renewal could otherwise block every API request before authentication is reached.
- `npm run ssl-pinning:check` is the pre-build invariant: it requires at least two aligned iOS/Android CA pins, rejects expired Android policy, and verifies every configured pin against the live production certificate chain.

## Auth Surface

- The login route keeps the same `useLoginScreenController` contract for mutation, captcha, error handling, legal links and navigation.
- The visual layer is now a dedicated premium auth shell using the brand gradient, glass fields, white primary CTA and light status bar requested by the mobile handoff.
- Login copy is read from `shared/i18n/locales/*.json`; the screen should not introduce new hardcoded product strings.
- Premium login handoff hardening is tracked in `docs/handoffs/mobile-design-handoff-status-2026-07-01.md`; placeholder copy and glass focus styling must stay covered by login screen tests.
- A successful login persists the canonical session before navigating to the private shell. Mounting that shell must not eagerly initialize every private route; the incident analysis and device smoke checklist live in `docs/wiki/mobile-login-crash-2026-07-23.md`.
- A login rejection with HTTP 401 is normalized to the safe user-facing message `E-mail ou senha inválidos.`. Transport/TLS failures keep the network-specific taxonomy from `AppErrorNotice`; they must never be presented as bad credentials.
- A protected resource returning 403 means the authenticated user lacks that resource permission; the global HTTP layer must preserve the session. Only 401 invalidates globally. The explicit bootstrap/subscription revalidation remains allowed to sign out on 401 or 403 because those endpoints validate the account shell itself.
- The TLS rotation outage and its native E2E evidence are documented in `docs/wiki/mobile-login-tls-pinning-incident-2026-07-24.md`.

## Private Navigation

- The logged-in mobile shell uses Expo Router `Tabs` with a custom `AppTabBar` instead of native tabs.
- The bottom navigation follows the mobile liquid menu handoff with five visible tabs: `Início`, `Transações`, `Insights`, `Cartões` and `Mais`.
- `Planejamento` is no longer a first-level tab; it is exposed through `MoreHubScreen` together with other secondary destinations.
- The former center `+` action is removed from the tab bar. Quick transaction creation remains available from the `Mais` hub through the shared expense sheet store.
- Tab content transitions use `core/navigation/tab-carousel-transition.ts`, which provides a fixed 480 ms full-width horizontal scene interpolation.
- The private navigator must keep `lazy: true` so only the focused route mounts during the post-login handoff. It must also keep `detachInactiveScreens` enabled so previously visited inactive screens leave the native view hierarchy while React Navigation preserves navigation state.
- The active tab affordance lives in `core/navigation/app-tab-bar.tsx` as a Reanimated liquid blob with fixed spring parameters, a gradient surface and the active icon rendered in white.
- The credit-cards guided tour no longer targets a `fab` anchor; its quick-transaction step is centered copy that points users to `Mais`.
- Native navigation depends on the package matrix supported by the installed Expo SDK. `npm run expo:check` is part of `quality-check` and must stay green before any build; JavaScript-only route tests cannot detect a React/React Native or native-module version drift.
- The cross-platform crash that exposed this invariant, including the affected Insights/Cards routes and native rebuild requirement, is documented in `docs/wiki/mobile-insights-cards-navigation-crash-2026-07-24.md`.

## Validation

- New or changed behavior must include tests in the same feature area.
- For this parity slice, the critical tests are the regional calculator model, regional screen, tools catalog, feature flag status, login screen handoff coverage, private navigator lazy/detach guarantees, critical Insights/Cards route smoke coverage, Expo SDK package alignment, shared-entries mobile parity including outgoing invitations, transaction observation form/feed/controller coverage, subscription provider resolution/cancellation/controller/screen coverage, and AI chat service/session/consent/gate/screen coverage.
- Native-auth changes additionally require the static pinning tests, the live TLS verifier, an Android release prebuild/build, and the Maestro login flow with masked-password, invalid-credential and successful-dashboard screenshots.
- No backend or database interface was added by this slice. If a future calculator starts consuming an API, run contracts checks and live database validation as required by `AGENTS.md`.

## Mobile Delivery Architecture

- `CI` is the mandatory trust boundary. `.github/workflows/delivery-after-ci.yml` only handles a trusted collaborator's same-repository PR revision after that exact SHA passes CI; forks and external authors never receive deployment credentials.
- Every non-generated PR supplies the canonical `## Changelog de loja` source. `scripts/store-release-notes.cjs` validates it and later builds the localized release metadata for Google Play, TestFlight and App Store Connect.
- `scripts/release-delivery-policy.cjs` compares Android/iOS Expo fingerprints with EAS builds from the target profile. A compatible finished runtime receives OTA, a missing runtime receives a native build, and an active compatible build suppresses duplicates.
- Release Please owns public version bumps. Its `extra-files` rule keeps `app.json` aligned with `package.json` and `.release-please-manifest.json`; the store workflow rejects any drift.
- Store builds are serialized globally. Android submission is deliberately draft until `scripts/google-play-release.cjs` attaches pt-BR notes to the exact `versionCode` and commits it as completed on the internal track.
- `store.config.js` maps the same generated notes to the exact Apple version through EAS Metadata, while `--what-to-test` supplies TestFlight.
- Internal delivery is automatic. Promotion to Google Play production or App Store production remains a human approval boundary.
