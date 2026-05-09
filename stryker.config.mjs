/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'npm',
  testRunner: 'jest',
  plugins: ['@stryker-mutator/jest-runner'],
  // "off" avoids per-test instrumentation which causes a circular-require stack overflow
  // in jest.setup.ts when the Stryker jest-runner wraps the module registry.
  // Without per-test analysis Stryker runs all tests for each mutant (slower but correct).
  coverageAnalysis: 'off',

  jest: {
    // jest.stryker.config.js extends jest.config.js and excludes tests that use
    // readFileSync with relative paths (shared/contracts/api-contract-map.test.ts)
    // which break in Stryker's in-place backup mode.
    configFile: 'jest.stryker.config.js',
    // Disable related-file detection: avoids "no test files found" when Stryker
    // can't trace imports through Jest's module resolution (similar to Vitest issue in web).
    enableFindRelatedTests: false,
  },

  /**
   * Mutation scope: pure business logic only.
   *
   * Targets: validators (Zod schemas), financial calculators, service-layer
   * pure functions, and shared utils/validators.
   * These files have boundary conditions and arithmetic that statement
   * coverage alone cannot verify.
   *
   * Excluded: mocks, contracts, config, screen components, hooks that
   * interact with React Native internals, test files.
   */
  mutate: [
    // Feature validators (Zod schemas — boundary logic)
    'features/auth/validators.ts',
    'features/accounts/validators.ts',
    'features/budgets/validators.ts',
    'features/credit-cards/validators.ts',
    'features/fiscal/validators.ts',
    'features/goals/validators.ts',
    'features/goals/validators-simulator.ts',
    'features/onboarding/validators.ts',
    'features/tags/validators.ts',
    'features/transactions/validators.ts',
    'features/user-profile/validators.ts',
    'features/user-profile/validators-salary-sim.ts',
    'features/wallet/validators.ts',
    'features/wallet/validators-operations.ts',

    // Financial calculators — pure functions, no RN deps
    'features/tools/services/calculators/math-utils.ts',
    'features/tools/services/calculators/br-tax-tables.ts',
    'features/tools/services/calculators/salario-liquido.ts',
    'features/tools/services/calculators/inss-ir-folha.ts',
    'features/tools/services/calculators/thirteenth-salary.ts',
    'features/tools/services/calculators/hora-extra.ts',
    'features/tools/services/calculators/mei.ts',
    'features/tools/services/calculators/clt-vs-pj.ts',
    'features/tools/services/calculators/rescisao.ts',
    'features/tools/services/calculators/reserva-emergencia.ts',
    'features/tools/services/calculators/orcamento-50-30-20.ts',
    'features/tools/services/calculators/aluguel-vs-compra.ts',
    'features/tools/services/calculators/cet.ts',
    'features/tools/services/calculators/custo-estilo-vida.ts',
    'features/tools/services/calculators/dividir-conta.ts',
    'features/tools/services/calculators/ferias.ts',
    'features/tools/services/calculators/fgts.ts',
    'features/tools/services/calculators/fii.ts',
    'features/tools/services/calculators/financiamento-imobiliario.ts',
    'features/tools/services/calculators/fire.ts',
    'features/tools/services/calculators/quitacao-dividas.ts',
    'features/tools/services/calculators/tesouro-direto.ts',
    'features/tools/services/calculators/aposentadoria.ts',
    'features/tools/services/calculators/desconto-markup.ts',

    // Other calculator/service pure logic
    'features/tools/services/compound-interest-calculator.ts',
    'features/tools/services/cdb-lci-lca-calculator.ts',
    'features/dashboard/services/savings-rate-calculator.ts',
    'features/dashboard/services/survival-index-calculator.ts',
    'features/dashboard/services/category-ranker.ts',
    'features/dashboard/services/trends-chart-projector.ts',
    'features/dashboard/services/period-comparison.ts',
    'features/goals/services/goal-progress-calculator.ts',
    'features/goals/services/goal-scenario-projector.ts',
    'features/focus/services/focus-metric-calculator.ts',
    'features/auth/services/password-strength-analyzer.ts',
    'features/auth/utils/email-mask.ts',
    'features/shared-entries/services/shared-entries-classifier.ts',
    'features/subscription/services/subscription-plan-comparator.ts',
    'features/transactions/services/calendar-grid.ts',
    'features/transactions/services/calendar-markers.ts',

    // Shared utils and validators
    'shared/utils/formatters.ts',
    'shared/validators/installment-vs-cash.ts',
    'shared/forms/apply-api-form-errors.ts',

    // Exclusions
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/*.test.tsx',
    '!**/*.spec.tsx',
    '!**/__mocks__/**',
    '!**/mocks.ts',
    '!**/contracts.ts',
    '!**/*.d.ts',
    '!**/*.config.{ts,js,mjs}',
  ],

  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },

  reporters: ['html', 'clear-text', 'progress'],

  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },

  // Jest + React Native transforms are slower than Vitest — use generous timeout
  timeoutMS: 30000,
  timeoutFactor: 2,

  concurrency: 2,

  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json',

  /**
   * Run in-place (no sandbox): avoids circular-require stack overflow that occurs
   * when Stryker copies the project to a sandbox directory and jest.setup.ts's
   * jest.mock("axios", () => require("axios/dist/node/axios.cjs")) enters an
   * infinite resolution loop through the sandboxed jest-runtime.
   * inPlace=true mutates source files directly (backed up and restored by Stryker).
   */
  inPlace: true,

  tempDirName: '.stryker-tmp',

  ignorePatterns: [
    'node_modules',
    '_worktrees',
    'repos',
    'coverage',
    'reports',
    '.expo',
    'android',
    'ios',
    'dist',
    'web-build',
  ],
};
