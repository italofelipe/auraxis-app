# CLAUDE.md — `shared/*`

Catálogo de recursos compartilhados do auraxis-app.
Antes de criar qualquer coisa nova, verifique se já existe aqui.

## Estrutura do shared

| Diretório | Conteúdo |
|-----------|----------|
| `shared/animations/` | Wrappers de Reanimated para transições padrão |
| `shared/components/` | Componentes reutilizáveis (atoms e molecules) |
| `shared/config/` | Configurações compartilhadas (query stale-times, etc.) |
| `shared/contracts/` | Mapa de contratos e catálogo de endpoints da API |
| `shared/feature-flags/` | Hook e config de feature flags |
| `shared/feedback/` | Estados de erro, empty state, success |
| `shared/forms/` | Inputs, selects, form wrappers com validação Zod |
| `shared/hooks/` | Hooks genéricos reutilizáveis |
| `shared/i18n/` | Internacionalização (pt.json, hook useI18n) |
| `shared/mocks/` | Factories e mocks compartilhados |
| `shared/skeletons/` | Loading placeholders para as telas principais |
| `shared/testing/` | Utilities de teste compartilhadas |
| `shared/theme/` | Tokens de cor, tipografia, espaçamento (Tamagui) |
| `shared/types/` | Interfaces e tipos TypeScript globais |
| `shared/utils/` | Funções utilitárias puras |
| `shared/validators/` | Schemas Zod reutilizáveis |

## Componentes disponíveis (`shared/components/`)

Explorar com: `ls shared/components/` antes de criar componente novo.
Padrão de import: `import { XyzComponent } from '@/shared/components'`

## Skeletons de loading (`shared/skeletons/`)

Toda tela com dados assíncronos deve usar um skeleton.
Skeletons existentes cobrem: Dashboard, Transactions, Goals, Portfolio, Wallet.

## Estados de feedback (`shared/feedback/`)

- `EmptyState` — tela sem dados (com CTA opcional)
- `ErrorState` — erro recuperável (com retry action)
- `LoadingOverlay` — loading fullscreen para operações críticas

## Formulários (`shared/forms/`)

- `FormField` — wrapper com label, error e hint
- `CurrencyInput` — input monetário com máscara BRL
- `DatePicker` — seletor de data nativo por plataforma
- Validators Zod reutilizáveis em `shared/validators/`

## Animações (`shared/animations/`)

- `FadeIn`, `SlideUp`, `ScalePress` — wrappers Reanimated
- Use esses wrappers, não Reanimated diretamente nos componentes de feature

## Tema (`shared/theme/`)

Tokens de design (base em `config/tamagui-theme.ts`):
- `colors` — paleta DS v3 Market Pulse e tokens semânticos light/dark
- `typography` — tamanhos, pesos, line-heights; fontes nativas atuais ficam em `config/design-tokens.ts`
- `spacing` — escala de espaçamento (base 8px: 4, 8, 12, 16, 24, 32, 48...)
- `borderRadius` — raios canônicos

**Nunca hardcode cores, fontes ou espaçamentos. Sempre use tokens semânticos.**

## Feature flags (`shared/feature-flags/`)

```typescript
import { useFeatureFlag } from '@/shared/feature-flags';
const isEnabled = useFeatureFlag('focus');
```

Flags ativas definidas em `config/feature-flags.json`.

## i18n (`shared/i18n/`)

- Strings em `shared/i18n/locales/pt.json`
- Hook: `const { t } = useI18n()`
- Nunca hardcode strings visíveis ao usuário
