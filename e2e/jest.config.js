/** @type {import('@jest/types').Config.InitialOptions} */
/**
 * Jest config específico para Detox E2E.
 * Separado do jest.config.js principal para não confundir testes unitários com E2E.
 */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.{ts,tsx}'],
  testTimeout: 120_000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
}
