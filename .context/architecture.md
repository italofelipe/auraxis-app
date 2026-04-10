# architecture.md — auraxis-app

## Stack

| Camada | Tecnologia | Versão |
|:-------|:-----------|:-------|
| Framework | Expo SDK 54 | 54.x |
| Toolchain | Node.js | 24 LTS |
| Runtime | React Native | 0.81.6 |
| Navegação | Expo Router | v6 (file-based) |
| Linguagem | TypeScript | strict mode |
| Lint | ESLint + eslint-config-expo | latest |
| Testes | Jest + React Native Testing Library | latest |
| Storage seguro | expo-secure-store | latest |
| HTTP | Axios + TanStack Query | canônico |
| Build | EAS Build | baseline configurada via `eas.json` |
| OTA | EAS Update | backlog posterior ao MVP1 |

## Estrutura de diretórios

```
auraxis-app/
  app/           # Telas e navegação (Expo Router — file-based)
    (private)/   # Grupo de rotas autenticadas
    (public)/    # Grupo de rotas públicas (login, registro)
    _layout.tsx  # Root layout
  components/    # Componentes React Native reutilizáveis
  core/          # Runtime transversal: http, query, navigation, session, shell, providers
    errors/      # Taxonomia de erro, boundaries e recoverability do cliente
  features/      # Domínios do app: auth, bootstrap, subscription, etc.
  shared/        # Config, mocks, contratos, forms, theme, testing e utilidades compartilhadas
  constants/     # Constantes, temas, cores
  hooks/         # Custom hooks (ex: useAuth, useTransactions)
  lib/           # Camada de compatibilidade temporária com o scaffold legado
  types/         # Tipos e interfaces TypeScript
  assets/        # Imagens, fontes, ícones
  scripts/       # Utilitários de desenvolvimento
  app.json       # Config do Expo (afeta build — pedir aprovação antes de alterar)
  tsconfig.json  # TypeScript config (strict: true obrigatório)
  eslint.config.js # ESLint config
```

## Fluxo de dados

```
Telas (app/)
  → Hooks de feature (features/*/hooks)
    → Services de feature (features/*/services)
      → Core HTTP/Query/Navigation/Session (core/)
        → auraxis-api (fonte única de verdade)
```

## Convenções de componentes

- Componentes em `components/` são puros (sem efeitos colaterais diretos).
- Lógica de estado vai em hooks ou providers, não em componentes.
- Telas (`app/`) devem conter apenas lógica de view e composição.
- Nenhuma chamada HTTP direta em componentes — sempre via hook ou service.
- `lib/` e `hooks/` legados existem apenas como camada de compatibilidade temporária.
- Testes de UI/feature devem preferir `shared/testing/test-providers.tsx` para evitar acoplamento desnecessário com bootstrap de runtime.
- Estados assíncronos de tela devem preferir `shared/components/app-query-state.tsx` e `shared/components/app-async-state.tsx`, mantendo `loading/empty/error/offline/degraded` fora das telas.

## Decisões de arquitetura

| Decisão | Escolha | Motivo |
|:--------|:--------|:-------|
| Navegação | Expo Router (file-based) | Padrão Expo SDK 54, convenção clara |
| Guards de rota | `core/navigation/*` | Centraliza redirects e evita regra de sessão espalhada em `.tsx` |
| Storage sensível | expo-secure-store | Keychain (iOS) / Keystore (Android) |
| HTTP | Axios | Interceptors, timeout, mock adapter e compatibilidade com o web |
| Auth tokens | expo-secure-store | Nunca AsyncStorage sem criptografia |
| Tipagem | strict: true | Sem `any`, inferência máxima |
| Organização | `core` + `features` + `shared` | Isolar runtime transversal e manter views finas |
| Mocks | adapter central de API | Permite scaffold rápido do app sem depender sempre do backend |
| Contratos de API | `shared/contracts/api-contract-map.ts` | Fonte tipada única de path/method/request/response para o app |
| Query keys | `core/query/query-keys.ts` | Evita drift de cache key e melhora invalidação futura |
| Taxonomia de erro | `core/errors/*` + `shared/components/app-error-notice.tsx` | Traduz erro técnico para estado de UI único com retry/recoverability |
| Async state composition | `core/query/query-feedback-state.ts` + `shared/components/app-query-state.tsx` | Unifica `loading`, `empty`, `offline`, `degraded` e `error` com runtime connectivity e error taxonomy |
| Skeleton loading | `shared/components/app-skeleton-block.tsx` | Substitui loading genérico por placeholder canônico, acessível e reaproveitável |
| Error boundaries | `core/errors/app-error-boundary.tsx` | Degrada falhas inesperadas no root e nos fluxos público/privado |
| Tema e motion | `shared/theme/*` + `shared/animations/*` | Unifica tokens semânticos, animações e acessibilidade |
| Formulários | `shared/forms/use-app-form.ts` + validators por feature | Reuso com Zod/RHF sem duplicar resolver/config |

## Contratos com auraxis-api

- Consumir apenas endpoints documentados em `auraxis-api/schema.graphql` ou OpenAPI spec.
- Não criar lógica de negócio no mobile — apenas apresentação e orchestração de chamadas.
- Versionar chamadas de API — não assumir contrato estável sem versão.
- Toda integração nova deve preferir `apiContractMap` + services de feature antes de criar string solta de endpoint.

## Matriz de segurança do cliente

| Superfície | Classificação | Regra canônica |
|:-----------|:--------------|:---------------|
| `EXPO_PUBLIC_API_*`, `EXPO_PUBLIC_FLAG_*`, `EXPO_PUBLIC_UNLEASH_*`, `EXPO_PUBLIC_OBSERVABILITY_EXPORT_KEY` | Pública | Pode estar no bundle; nunca pode representar segredo de servidor ou credencial privilegiada |
| `expo.extra.sentryDsn`, `expo.extra.appEnv`, `expo.extra.eas.projectId` | Pública | Permitida em `app.json`; serve apenas a bootstrap/observabilidade/release |
| `accessToken`, `refreshToken`, `user.email` | Sensível | Persistir somente no payload canônico do `SecureStore`; proibido duplicar em storage legado, logs ou telemetria |
| Chaves legadas `auraxis.access-token` / `auraxis.user-email` | Temporária | Apenas leitura de migração; devem ser limpas após regravação canônica |
| Deep links, retorno de checkout, breadcrumbs e logs | Temporária sanitizada | Sempre registrar apenas URL/contexto redigido (`token`, `password`, `email`, `auth_code` e similares) |
| Tokens de servidor, API tokens, secrets e passwords | Proibida no cliente | Não podem aparecer nem em `process.env`, nem em `expo.extra`, nem em fallbacks de runtime do app |

## Guardrails de segurança do cliente

- `scripts/check-client-security-governance.cjs` é o scanner canônico do app para:
  - bloquear referências a env vars banidas em código cliente;
  - bloquear `expo.extra` com nomes sensíveis;
  - bloquear reintrodução de persistência legada de sessão.
- O guardrail roda dentro de `npm run policy:check` e, por consequência, falha cedo em `npm run quality-check`.
- `SecureStore` do app escreve somente `auraxis.session`; as chaves legadas existem apenas para migração e limpeza.

## Plataformas suportadas

- **iOS**: target mínimo a definir (sugestão: iOS 15+)
- **Android**: target mínimo a definir (sugestão: API 31+)
- **Web**: via expo-web-browser (funcionalidade reduzida — não é o foco)
