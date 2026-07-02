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

## Premium Login Flow

1. `LoginScreen` obtains all auth actions and state from `useLoginScreenController`.
2. The premium auth shell renders only presentation: brand background, glass inputs, captcha, CTA, session notice and legal links.
3. Premium labels and placeholders come from `shared/i18n/locales/*.json`; focus state only changes the local glass input shell styling.
4. Email and password fields still write into the same React Hook Form controller.
5. Submit calls `controller.handleSubmit`, preserving captcha enforcement and login mutation behavior.
6. Successful login still consumes any stored auth redirect and navigates to the intended private route or dashboard.
7. Session-expired and submit-error states render on the same screen without changing session policy.

## Liquid Tab Navigation Flow

1. `app/(private)/_layout.tsx` builds the logged-in tab navigator from `privateTabDefinitions`.
2. `privateTabDefinitions` exposes `dashboard`, `transacoes`, `insights`, `cartoes` and `mais`; `planejamento` is registered as a hidden route.
3. `AppTabBar` measures each rendered tab with `onLayout` and stores `{ x, width }` by route name.
4. When the active route changes, the Reanimated shared values move the liquid blob to the measured tab center with fixed spring parameters and squish timing.
5. The active icon is rendered inside the blob while the active tab column reserves icon space and keeps the label visible.
6. The tab navigator uses `createTabCarouselSceneStyleInterpolator(width)` plus `tabCarouselTransitionSpec` so route content slides horizontally with a fixed 480 ms timing curve.
7. `MoreHubScreen` handles displaced actions: route cards call `router.push(href)`, while `Nova transação` opens the shared expense sheet store directly.
8. The credit-cards tour quick-transaction step is centered instructional copy, so it does not depend on a removed `fab` anchor.

## Transaction Observation Flow

1. `TransactionForm` collects `description` and `observation` as separate optional inputs.
2. `createTransactionSchema` and `updateTransactionSchema` trim and validate both strings locally before submit.
3. `useTransactionsScreenController` builds the existing create/update command and includes `observation` alongside `description`.
4. `transactions-service` already maps `observation` to the API payload/response, so no backend route, DB migration or contract snapshot change is required.
5. `toFeedItem` copies `observation` into the feed view-model, and `TxCardBody` renders it under an `Observações` label when present.
6. `TransactionActionSheet` shows description and observations as separate details before the action buttons.

## Testing Flow

- Pure calculator behavior is verified before screen tests.
- Screen tests assert that inputs, results and controller actions are wired.
- Feature flag tests assert production status for promoted parity features.
- Login tests assert the premium surface, localized placeholders, focus styling and preserved auth controller actions.
- Transaction observation tests cover schema validation, form submission/edit prefill, controller payloads, duplicate behavior, feed mapping, card rendering and action sheet details.
