/** @type {import('jest').Config} */
const config = {
  // jest-expo lida com o preset correto por plataforma
  preset: "jest-expo",

  // Padrões de arquivos de teste
  testMatch: ["**/__tests__/**/*.{ts,tsx}", "**/*.{spec,test}.{ts,tsx}"],

  testPathIgnorePatterns: ["/node_modules/", "/e2e/", "/.expo/"],

  // Transformações: jest-expo já configura babel-jest para RN
  transformIgnorePatterns: [
    "node_modules/(?!(" +
      "@react-native|react-native|react-native-.*|expo.*|@expo.*|" +
      "@unimodules.*|unimodules.*|sentry-expo|native-base|" +
      "react-clone-referenced-element|@react-navigation|tamagui|@tamagui" +
      "))",
  ],

  // Módulos que o Node não consegue importar diretamente (assets, etc.)
  moduleNameMapper: {
    "\\.svg$": "<rootDir>/__mocks__/svgMock.ts",
    "\\.(png|jpg|jpeg|gif|webp)$": "<rootDir>/__mocks__/imageMock.ts",
    "^@sentry/react-native$": "<rootDir>/__mocks__/sentryReactNativeMock.ts",
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
  },

  // Setup files: configura @testing-library/jest-native matchers
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Cobertura
  // APP9 baseline: cobertura inicial em fluxo crítico de tema/renderização.
  collectCoverageFrom: [
    "features/tools/services/tools-service.ts",
    "features/tools/hooks/use-tools-catalog-query.ts",
    "app/index.tsx",
    "app/(private)/ferramentas.tsx",
    "core/providers/app-providers.tsx",
    "core/navigation/deep-linking.ts",
    "core/telemetry/app-logger.ts",
    "core/telemetry/domain-loggers.ts",
    "core/telemetry/logging-policy.ts",
    "core/telemetry/operational-context.ts",
    "core/telemetry/sanitization.ts",
    "core/telemetry/use-observability-runtime-bridge.ts",
    "core/telemetry/use-navigation-telemetry.ts",
    "core/performance/performance-budgets.ts",
    "core/performance/performance-clock.ts",
    "core/performance/performance-tracker.ts",
    "core/errors/app-error.ts",
    "core/errors/app-error-boundary.tsx",
    "core/http/api-error.ts",
    "core/http/http-client.ts",
    "core/query/query-feedback-state.ts",
    "core/query/query-client.ts",
    "core/query/query-policy.ts",
    "core/query/prefetch-api-query.ts",
    "core/session/session-policy.ts",
    "core/session/session-storage.ts",
    "core/session/session-store.ts",
    "core/query/retry-policy.ts",
    "core/shell/reachability-service.ts",
    "core/shell/runtime-revalidation.ts",
    "core/shell/use-app-startup.ts",
    "core/shell/use-runtime-lifecycle.ts",
    "app/services/sentry.ts",
    "features/subscription/services/hosted-checkout-service.ts",
    "shared/feature-flags/service.ts",
    "shared/components/app-screen.tsx",
    "shared/components/app-surface-card.tsx",
    "shared/components/app-button.tsx",
    "shared/components/app-input-field.tsx",
    "shared/components/app-key-value-row.tsx",
    "shared/components/app-toggle-row.tsx",
    "shared/components/app-error-notice.tsx",
    "shared/components/app-async-state.tsx",
    "shared/components/app-query-state.tsx",
    "shared/components/async-state-notice.tsx",
    "shared/components/app-skeleton-block.tsx",
    "shared/testing/test-providers.tsx",
    "shared/testing/test-query-client.ts",
    "shared/utils/formatters.ts",
    "shared/validators/installment-vs-cash.ts",
    "features/alerts/components/alert-record-card.tsx",
    "features/alerts/components/alert-preference-row.tsx",
    "features/entitlements/components/paywall-gate.tsx",
    "features/entitlements/hooks/use-feature-access.ts",
    "features/fiscal/services/fiscal-service.ts",
    "features/fiscal/hooks/use-fiscal-query.ts",
    "features/fiscal/hooks/use-fiscal-mutations.ts",
    "features/questionnaire/services/questionnaire-service.ts",
    "features/questionnaire/hooks/use-questionnaire-query.ts",
    "features/questionnaire/hooks/use-questionnaire-mutations.ts",
    "features/shared-entries/services/shared-entries-service.ts",
    "features/shared-entries/hooks/use-shared-entries-query.ts",
    "features/shared-entries/hooks/use-shared-entries-mutations.ts",
    "features/subscription/components/upgrade-cta.tsx",
    "features/tools/services/installment-vs-cash-service.ts",
    "features/tools/hooks/use-installment-vs-cash-history-query.ts",
    "features/tools/components/installment-vs-cash-form.tsx",
    "features/tools/components/installment-vs-cash-history-list.tsx",
    "features/tools/components/installment-vs-cash-result-card.tsx",
    "features/transactions/services/transactions-service.ts",
    "features/transactions/hooks/use-transactions-query.ts",
    "features/transactions/hooks/use-transaction-mutations.ts",
    "features/user-profile/services/user-profile-service.ts",
    "features/user-profile/hooks/use-user-profile-query.ts",
    "features/user-profile/hooks/use-user-profile-mutations.ts",
    "app/(private)/installment-vs-cash.tsx",
    "components/themed-text.tsx",
    "components/themed-view.tsx",
    "components/ui/collapsible.tsx",
    "hooks/use-theme-color.ts",
    "!**/*.d.ts",
    "!**/*.config.{ts,js}",
  ],

  coverageThreshold: {
    global: {
      lines: 85,
      functions: 85,
      branches: 85,
      statements: 85,
    },
  },

  coverageReporters: ["text", "json", "lcov", "html"],
  coverageDirectory: "coverage",

  testTimeout: 10_000,
};

module.exports = config;
