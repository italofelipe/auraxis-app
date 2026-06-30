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

## Feature Flags

- `app.transactions.installments` is promoted to `enabled-prod` after app-side parity validation for transaction installments.
- `app.credit-cards.expense-actions` is promoted to `enabled-prod` after app-side parity validation for edit, duplicate and delete actions in credit card invoices.
- Local flag status is tested through `shared/feature-flags/service.test.ts`; runtime providers can still override decisions where configured.

## Auth Surface

- The login route keeps the same `useLoginScreenController` contract for mutation, captcha, error handling, legal links and navigation.
- The visual layer is now a dedicated premium auth shell using the brand gradient, glass fields, white primary CTA and light status bar requested by the mobile handoff.
- Login copy is read from `shared/i18n/locales/*.json`; the screen should not introduce new hardcoded product strings.

## Private Navigation

- The logged-in mobile shell uses Expo Router `Tabs` with a custom `AppTabBar` instead of native tabs.
- The bottom navigation follows the mobile liquid menu handoff with five visible tabs: `Início`, `Transações`, `Insights`, `Cartões` and `Mais`.
- `Planejamento` is no longer a first-level tab; it is exposed through `MoreHubScreen` together with other secondary destinations.
- The former center `+` action is removed from the tab bar. Quick transaction creation remains available from the `Mais` hub through the shared expense sheet store.
- Tab content transitions use `core/navigation/tab-carousel-transition.ts`, which provides a fixed 480 ms full-width horizontal scene interpolation while keeping tab screens mounted.
- The active tab affordance lives in `core/navigation/app-tab-bar.tsx` as a Reanimated liquid blob with fixed spring parameters, a gradient surface and the active icon rendered in white.
- The credit-cards guided tour no longer targets a `fab` anchor; its quick-transaction step is centered copy that points users to `Mais`.

## Validation

- New or changed behavior must include tests in the same feature area.
- For this parity slice, the critical tests are the regional calculator model, regional screen, tools catalog, feature flag status and login screen.
- No backend or database interface was added by this slice. If a future calculator starts consuming an API, run contracts checks and live database validation as required by `AGENTS.md`.
