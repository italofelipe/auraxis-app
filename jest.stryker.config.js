/**
 * Jest configuration for Stryker mutation testing.
 *
 * Extends the base jest.config.js with overrides needed for Stryker:
 * - Excludes `shared/contracts/api-contract-map.test.ts` which uses
 *   `readFileSync('./contracts/known-openapi-gaps.json')` — a relative path
 *   that breaks when Stryker runs in-place mode because the backup directory
 *   does not contain the JSON file.
 *
 * @type {import('jest').Config}
 */
const baseConfig = require('./jest.config');

/** @type {import('jest').Config} */
const config = {
  ...baseConfig,
  testPathIgnorePatterns: [
    ...(baseConfig.testPathIgnorePatterns ?? []),
    // Exclude contract-map test: uses readFileSync with relative path that
    // resolves into Stryker's backup dir during in-place mutation runs.
    'shared/contracts/api-contract-map\\.test\\.ts',
  ],
};

module.exports = config;
