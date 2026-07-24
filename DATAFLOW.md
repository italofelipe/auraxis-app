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

## Production Runtime Config Flow

1. `shared/config/runtime.ts` reads `EXPO_PUBLIC_APP_ENV` from Expo public env and falls back to `expo.extra.appEnv` or `development`.
2. The same module resolves `apiBaseUrl` from `EXPO_PUBLIC_API_URL`, then `expo.extra.apiUrl`, then the local development fallback `http://localhost:5000`.
3. `normalizeBaseUrl` removes trailing slashes so downstream clients receive a stable base URL.
4. If the resolved app environment is `production`, `assertProductionApiBaseUrl` rejects invalid URLs, non-HTTPS URLs and localhost-style hosts before exporting `appRuntimeConfig`.
5. `core/http/http-client.ts` imports the guarded `appRuntimeConfig.apiBaseUrl`; a production bundle without a safe API URL fails fast instead of dispatching requests to localhost.

## Premium Login Flow

1. `LoginScreen` obtains all auth actions and state from `useLoginScreenController`.
2. The premium auth shell renders only presentation: brand background, glass inputs, captcha, CTA, session notice and legal links.
3. Premium labels and placeholders come from `shared/i18n/locales/*.json`; focus state only changes the local glass input shell styling.
4. Email and password fields still write into the same React Hook Form controller.
5. Submit calls `controller.handleSubmit`, preserving captcha enforcement and login mutation behavior.
6. Successful login waits for the canonical session to be persisted, then consumes any stored auth redirect and navigates to the intended private route or dashboard.
7. The private navigator mounts only the focused route (`lazy: true`) and detaches inactive screens from the native hierarchy, preventing the login handoff from initializing the complete private route tree.
8. Session-expired and submit-error states render on the same screen without changing session policy.

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
- Login tests assert the premium surface, localized placeholders, focus styling, preserved auth controller actions and safe lazy/detached initialization of the private navigator.
- Shared-entries tests assert controller counts, summary rendering, tab counters, incoming/outgoing invitation separation, outgoing composer actions and stable tab actions.
- Transaction observation tests cover schema validation, form submission/edit prefill, controller payloads, duplicate behavior, feed mapping, card rendering and action sheet details.
- Subscription tests cover provider routing, canonical URL fallback, API response mapping, duplicate-request prevention, query/entitlement invalidation, explicit confirmation, retry, loading and post-cancellation states.
