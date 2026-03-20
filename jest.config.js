/** @type {import('jest').Config} */
const config = {
  // jest-expo lida com o preset correto por plataforma
  preset: "jest-expo",

  // Padrões de arquivos de teste
  testMatch: [
    "**/__tests__/**/*.{ts,tsx}",
    "**/*.{spec,test}.{ts,tsx}",
  ],

  testPathIgnorePatterns: [
    "/node_modules/",
    "/e2e/",
    "/.expo/",
  ],

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
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
  },

  // Setup files: configura @testing-library/jest-native matchers
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],

  // Cobertura
  // APP9 baseline: cobertura inicial em fluxo crítico de tema/renderização.
  collectCoverageFrom: [
    "lib/api.ts",
    "lib/tools-api.ts",
    "hooks/queries/use-tools-query.ts",
    "components/ui/screen-container.tsx",
    "app/index.tsx",
    "app/(private)/ferramentas.tsx",
    "components/providers/app-providers.tsx",
    "shared/feature-flags/service.ts",
    "shared/components/app-screen.tsx",
    "shared/components/app-surface-card.tsx",
    "shared/components/app-button.tsx",
    "shared/components/app-input-field.tsx",
    "shared/components/async-state-notice.tsx",
    "shared/utils/formatters.ts",
    "shared/validators/installment-vs-cash.ts",
    "lib/installment-vs-cash-api.ts",
    "lib/entitlements-api.ts",
    "hooks/queries/use-installment-vs-cash-history-query.ts",
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
