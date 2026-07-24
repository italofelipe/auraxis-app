/**
 * lint-staged — auraxis-app
 *
 * Roda em staged files apenas (não no projeto inteiro).
 * TypeScript check (`tsc --noEmit`) roda no pre-push porque
 * precisa do contexto global do projeto.
 */
module.exports = {
  // TypeScript e TSX — lint + fix automático
  // --no-warn-ignored: suprime warning de arquivos ignorados (e.g., e2e/)
  // shared/types/generated/** é ignorado via eslint.config.js para preservar
  // o formato byte-identical ao output do graphql-codegen (usado em codegen:check).
  "**/*.{ts,tsx}": [
    "eslint --fix --max-warnings 0 --no-warn-ignored",
    "node scripts/check-frontend-governance.cjs",
    "node scripts/check-api-contract-governance.cjs",
    "node scripts/check-openapi-secret-hygiene.cjs",
  ],

  // JSON — formatação
  "**/*.json": ["prettier --write", "node scripts/check-openapi-secret-hygiene.cjs"],

  "{package.json,package-lock.json,.nvmrc,app.json,eas.json,.release-please-config.json,lint-staged.config.js,store.config.js,README.md,CODING_STANDARDS.md,steering.md,.context/quality_gates.md,.context/architecture.md,.github/pull_request_template.md,.github/workflows/ci.yml,.github/workflows/delivery-after-ci.yml,.github/workflows/deploy-minimum.yml,.github/workflows/ota-update.yml,.github/workflows/store-release.yml,scripts/run_ci_like_actions_local.sh,scripts/release-delivery-policy.cjs,scripts/store-release-notes.cjs,scripts/google-play-release.cjs}":
    [
      "node scripts/check-runtime-release-governance.cjs",
      "node scripts/check-client-security-governance.cjs",
      "node scripts/check-client-logging-governance.cjs",
    ],
};
