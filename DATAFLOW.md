# Auraxis App Data Flow

## Regional Cost Of Living Tool

1. User opens `Ferramentas` and selects `Custo de vida regional`.
2. The tools catalog entry routes to `app/(private)/custo-de-vida-regional.tsx`.
3. `PaywallGate` enforces `advanced_simulations` access before rendering the tool.
4. `RegionalCostOfLivingScreen` collects UF, monthly income and expense categories.
5. `validateRegionalCostForm` rejects unknown UF, missing income or empty expenses.
6. `calculateRegionalCost` reads the local UF dataset, computes totals, percentages, FIRE target and sustainability score.
7. `CalculatorResultCard` renders the diagnosis and can persist the simulation through `useSaveSimulationMutation`.

No network call or database mutation is required until the user explicitly saves the simulation.

## Feature Flag Release Flow

1. UI code imports a feature flag key such as `app.transactions.installments` or `app.credit-cards.expense-actions`.
2. `shared/feature-flags/service.ts` resolves an explicit environment override first.
3. If no override exists, it uses local catalog status from `config/feature-flags.json`.
4. `enabled-prod` means the app fallback treats the feature as enabled in production-ready builds.
5. Remote provider decisions can still override the local fallback when Unleash mode is configured.

## AI Financial Chat Flow

1. `app/(private)/_layout.tsx` mounts `AiChatHost` after the authenticated tab navigator. The launcher remains available across private screens while the session exists.
2. `useAiChatController` resolves `app.features.ai-chat`. When disabled, the host returns `null` and the entitlement/consent hooks are disabled.
3. Opening the sheet checks the canonical `advanced_simulations` entitlement. A user without access sees the Premium route CTA and no chat request is made.
4. For an entitled user, `useAiInsightConsent` reads `GET /me/consents`. A current `ai/granted` event unlocks the assistant; absence or revocation shows the transparency gate.
5. Granting calls `POST /me/consents` with `{ kind: "ai", version: "1.0", action: "granted", source: "app" }`. Only the successful server response updates the in-memory state; iOS/Android SecureStore then receives a best-effort cache copy. Expo Web previews use volatile memory and never persist this sensitive state to `localStorage`.
6. The composer trims the question, enforces the API maximum of 1,000 characters and calls `POST /ai/chat` through `aiChatService`.
7. The service applies a 45-second timeout and maps `answer`, `model`, `tokens_used`, `cost_usd`, `period_label` and `tool_rounds` into the mobile domain result.
8. `useAiChatSession` appends the user message once and then the assistant answer. Closing/reopening the modal preserves the in-memory transcript; logout clears it by unmounting the private layout.
9. `ENTITLEMENT_REQUIRED`, `AI_CONSENT_REQUIRED`, `AI_INSIGHT_BUDGET_EXCEEDED`, validation, timeout and provider/server failures map to separate UI copy.
10. Timeout/server failures retain the pending question for explicit retry without adding a second user bubble. A consent rejection offers a new server grant and automatically retries that same pending question.
11. The backend owns daily quota and cost policy. The app does not hard-code remaining calls and does not automatically retry budget, validation or entitlement failures.
12. Analytics receives only `ai.chat.opened`, `ai.chat.question.sent`, `ai.chat.answer.received` and `ai.chat.request.failed` with non-sensitive booleans/classifications. The question and answer never leave the request/transcript path.

## Production Runtime Config Flow

1. `shared/config/runtime.ts` reads `EXPO_PUBLIC_APP_ENV` from Expo public env and falls back to `expo.extra.appEnv` or `development`.
2. The same module resolves `apiBaseUrl` from `EXPO_PUBLIC_API_URL`, then `expo.extra.apiUrl`, then the local development fallback `http://localhost:5000`.
3. `normalizeBaseUrl` removes trailing slashes so downstream clients receive a stable base URL.
4. If the resolved app environment is `production`, `assertProductionApiBaseUrl` rejects invalid URLs, non-HTTPS URLs and localhost-style hosts before exporting `appRuntimeConfig`.
5. `core/http/http-client.ts` imports the guarded `appRuntimeConfig.apiBaseUrl`; a production bundle without a safe API URL fails fast instead of dispatching requests to localhost.

## Premium Login Flow

1. Before any HTTP payload is exchanged, the native transport validates the system certificate chain and an allowed CA SPKI for `api.auraxis.com.br`.
2. iOS consumes the CA pins from `NSPinnedCAIdentities`; the Android Expo config plugin copies the matching XML and references it from the generated application manifest.
3. `LoginScreen` obtains all auth actions and state from `useLoginScreenController`.
4. The premium auth shell renders only presentation: brand background, glass inputs, captcha, CTA, session notice and legal links.
5. Premium labels and placeholders come from `shared/i18n/locales/*.json`; focus state only changes the local glass input shell styling.
6. Email and password fields still write into the same React Hook Form controller, and the password remains masked unless the user explicitly toggles visibility.
7. Submit calls `controller.handleSubmit`, preserving captcha enforcement and login mutation behavior.
8. HTTP 401 is rendered as invalid credentials. DNS, connectivity and TLS failures retain the network-specific error description so the UI does not falsely blame the credentials.
9. Successful login waits for the canonical session to be persisted, then consumes any stored auth redirect and navigates to the intended private route or dashboard.
10. Optional private queries may return 403 when the user lacks a product entitlement. The response remains local to that resource and does not clear the valid session.
11. Only a global 401, token expiry, or an explicit bootstrap/subscription revalidation failure invalidates the session.
12. The private navigator mounts only the focused route (`lazy: true`) and detaches inactive screens from the native hierarchy, preventing the login handoff from initializing the complete private route tree.
13. Session-expired and submit-error states render on the same screen without changing session policy.

## Shared Entries Flow

1. `app/(private)/compartilhamentos.tsx` mounts `SharedEntriesScreen`.
2. `PaywallGate` checks the `shared_entries` entitlement before rendering premium sharing data.
3. `useSharedEntriesScreenController` starts three independent TanStack queries: `sharedEntries.byMe`, `sharedEntries.withMe` and `sharedEntries.invitations`.
4. `sharedEntriesService` resolves the generated contract paths for `/shared-entries/by-me`, `/shared-entries/with-me` and `/shared-entries/invitations`, then maps API snake_case payloads into app records.
5. `sharedEntriesClassifier` derives buckets, labels and invitation direction. Pending incoming invitations exclude records whose `fromUserId` matches the current session user; outgoing invitations include only records sent by the current user.
6. The controller derives tab counts plus the summary totals from the classified lists and keeps a local outgoing invitation form with selected shared entry, invitee email, optional split percentage, optional exact amount, optional message and expiry hours.
7. `SharedEntriesScreen` renders the summary card first, then the `Convites`, `Compartilhei` and `Recebi` tabs with counters.
8. `Convites` accepts/rejects received invitations. `Compartilhei` creates invitations with `createInvitation`, lists sent invitations and revokes pending sent invitations with `deleteInvitation`. Revoke actions for shared entries still apply only to `byMe` entries; `withMe` entries stay read-only.

## Liquid Tab Navigation Flow

1. `app/(private)/_layout.tsx` builds the logged-in tab navigator from `privateTabDefinitions`.
2. `privateTabDefinitions` exposes `dashboard`, `transacoes`, `insights`, `cartoes` and `mais`; `planejamento` is registered as a hidden route.
3. `AppTabBar` measures each rendered tab with `onLayout` and stores `{ x, width }` by route name.
4. When the active route changes, the Reanimated shared values move the liquid blob to the measured tab center with fixed spring parameters and squish timing.
5. The active icon is rendered inside the blob while the active tab column reserves icon space and keeps the label visible.
6. The tab navigator uses `createTabCarouselSceneStyleInterpolator(width)` plus `tabCarouselTransitionSpec` so route content slides horizontally with a fixed 480 ms timing curve.
7. `lazy: true` defers each route until its first focus; `detachInactiveScreens` removes inactive native views without changing route definitions or the custom tab transition.
8. `MoreHubScreen` handles displaced actions: route cards call `router.push(href)`, while `Nova transação` opens the shared expense sheet store directly.
9. The credit-cards tour quick-transaction step is centered instructional copy, so it does not depend on a removed `fab` anchor.
10. Before lint, policy and coverage in the full quality gate, `npm run expo:check` compares declared React, React Native, React Navigation and native-module versions with the installed Expo SDK compatibility matrix.
11. A native dependency drift blocks delivery even when route-level Jest tests pass, because Jest replaces the iOS/Android native implementations with JavaScript mocks.

## Transaction Observation Flow

1. `TransactionForm` collects `description` and `observation` as separate optional inputs.
2. `createTransactionSchema` and `updateTransactionSchema` trim and validate both strings locally before submit.
3. `useTransactionsScreenController` builds the existing create/update command and includes `observation` alongside `description`.
4. `transactions-service` already maps `observation` to the API payload/response, so no backend route, DB migration or contract snapshot change is required.
5. `toFeedItem` copies `observation` into the feed view-model, and `TxCardBody` renders it under an `Observações` label when present.
6. `TransactionActionSheet` shows description and observations as separate details before the action buttons.

## Subscription Management Flow

1. `SubscriptionScreen` reads `/subscriptions/me` through `useSubscriptionStateQuery`.
2. `resolveSubscriptionManagementAction` normalizes the returned `provider` and chooses exactly one owner:
   - `abacatepay`, `asaas`, `stub` or a provider-less active/trial subscription: Auraxis API;
   - Apple aliases: App Store subscriptions center;
   - Google aliases: Google Play subscriptions center;
   - unknown provider: canonical Auraxis Web page `/subscription`.
3. For an API-managed subscription, tapping `Cancelar assinatura` only opens the confirmation sheet. No request is sent before the explicit confirmation.
4. Confirmation calls `useCancelSubscriptionMutation`, which sends `POST /subscriptions/cancel` without inventing a second provider contract.
5. A synchronous in-flight guard rejects duplicate taps while the mutation is active.
6. Success writes the returned `SubscriptionState` into `queryKeys.subscription.me()`, invalidates `subscription` and `entitlements`, closes the sheet and shows the final access date.
7. Failure keeps the sheet open, preserves the existing subscription and exposes retry/close actions.
8. Store-managed subscriptions open the official store surface; an opening failure stays on-screen with retry instead of silently dropping the action.

## Testing Flow

- Pure calculator behavior is verified before screen tests.
- Screen tests assert that inputs, results and controller actions are wired.
- Feature flag tests assert production status for promoted parity features.
- Login tests assert the premium surface, localized placeholders, focus styling, password masking, transport-versus-credential error taxonomy, preserved auth controller actions and safe lazy/detached initialization of the private navigator.
- Critical-tab smoke tests mount the production Insights and Cards route wrappers, while `npm run expo:check` covers the native dependency boundary those tests cannot execute.
- Native TLS tests assert CA-pin parity across iOS and Android, generated-manifest integration and a live match against the production chain; Maestro captures the invalid and successful login states from a release build.
- Shared-entries tests assert controller counts, summary rendering, tab counters, incoming/outgoing invitation separation, outgoing composer actions and stable tab actions.
- Transaction observation tests cover schema validation, form submission/edit prefill, controller payloads, duplicate behavior, feed mapping, card rendering and action sheet details.
- Subscription tests cover provider routing, canonical URL fallback, API response mapping, duplicate-request prevention, query/entitlement invalidation, explicit confirmation, retry, loading and post-cancellation states.
- AI chat tests cover request/envelope mapping, 1–1,000 character validation, timeout/error taxonomy, consent authority/cache fallback, entitlement/feature gates, session transcript, sanitized analytics, retry without duplication and the rendered Premium/consent/chat states.
- The visual E2E runs the versioned mock adapter in a `390x844` Expo Web viewport. The mock router test protects Axios `config.params`, while storage/theme tests protect the Web preview without weakening native SecureStore behavior.

## Automatic Mobile Delivery Flow

1. A PR author writes two or more user-facing pt-BR bullets under `## Changelog de loja`.
2. CI validates the notes, application quality and the exact PR SHA.
3. A successful CI `workflow_run` resolves the associated same-repository PR and rejects forks or direct unassociated pushes.
4. Expo generates Android and iOS native fingerprints; the delivery policy compares them with EAS builds from `preview` or `production`.
5. A compatible runtime publishes EAS Update with the detailed changelog; a missing preview runtime starts one Android+iOS preview build; an active match creates no duplicate.
6. On main, a native mismatch is handed to the Release Please tag instead of starting a competing build.
7. The tag workflow validates package/app/manifest versions and aggregates the source PR changelogs into `build/store-release/metadata.json`.
8. EAS builds/submits once. TestFlight receives What to Test and EAS Metadata writes App Store pt-BR release notes.
9. Google Play receives the AAB as draft. The publisher script finds the exact versionCode, writes localized notes, changes it to completed and commits the edit.
10. Human approval is still required to promote internal/TestFlight artifacts to the public stores.
