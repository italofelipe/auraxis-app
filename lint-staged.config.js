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
  '**/*.{ts,tsx}': [
    'eslint --fix --max-warnings 0 --no-warn-ignored',
    'node scripts/check-frontend-governance.cjs',
    'node scripts/check-api-contract-governance.cjs',
    'node scripts/check-openapi-secret-hygiene.cjs',
  ],

  // JSON — formatação
  '**/*.json': [
    'prettier --write',
    'node scripts/check-openapi-secret-hygiene.cjs',
  ],
}
