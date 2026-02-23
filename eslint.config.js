// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Arquivos ignorados pelo ESLint
    ignores: [
      'dist/*',
      'e2e/**',        // E2E (Detox) tem deps separadas não instaladas no CI padrão
      'artifacts/**',
    ],
  },
]);
