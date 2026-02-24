// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // Arquivos ignorados pelo ESLint
    ignores: [
      "dist/*",
      "e2e/**", // E2E (Detox) tem deps separadas não instaladas no CI padrão
      "artifacts/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: false }],
      complexity: ["error", 12],
      "max-params": ["error", 3],
      "max-lines-per-function": [
        "error",
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "max-depth": ["error", 3],
      "max-statements": ["error", 18],
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "object-shorthand": ["error", "always"],
      "no-duplicate-imports": "error",
      "consistent-return": "error",
      "max-classes-per-file": ["error", 1],
      "class-methods-use-this": "warn",
      "accessor-pairs": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    // Arquivos de scaffold inicial do Expo Router têm exemplo verboso por padrão.
    files: ["app/(tabs)/index.tsx", "app/(tabs)/explore.tsx"],
    rules: {
      "max-lines-per-function": "off",
      "no-alert": "off",
    },
  },
  {
    // Testes permitem funções maiores/mais complexas para setup e cenários.
    files: ["**/*.{test,spec}.{js,jsx,ts,tsx}", "**/__tests__/**/*.{js,jsx,ts,tsx}"],
    rules: {
      complexity: ["error", 20],
      "max-lines-per-function": [
        "error",
        {
          max: 140,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "max-statements": ["error", 30],
      "no-console": "off",
    },
  },
]);
