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
  '**/*.{ts,tsx}': [
    'eslint --fix --max-warnings 0 --no-warn-ignored',
  ],

  // JSON — formatação
  '**/*.json': [
    'prettier --write',
  ],
}
