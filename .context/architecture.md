# architecture.md — auraxis-app

## Stack

| Camada | Tecnologia | Versão |
|:-------|:-----------|:-------|
| Framework | Expo SDK 54 | 54.x |
| Runtime | React Native | 0.81.5 |
| Navegação | Expo Router | v6 (file-based) |
| Linguagem | TypeScript | strict mode |
| Lint | ESLint + eslint-config-expo | latest |
| Testes | Jest + React Native Testing Library | latest |
| Storage seguro | expo-secure-store | latest |
| HTTP | Axios + TanStack Query | canônico |
| Build | EAS Build | (a configurar — APP5) |
| OTA | EAS Update | (a configurar) |

## Estrutura de diretórios

```
auraxis-app/
  app/           # Telas e navegação (Expo Router — file-based)
    (private)/   # Grupo de rotas autenticadas
    (public)/    # Grupo de rotas públicas (login, registro)
    _layout.tsx  # Root layout
  components/    # Componentes React Native reutilizáveis
  core/          # Runtime transversal: http, query, session, providers
  features/      # Domínios do app: auth, bootstrap, subscription, etc.
  shared/        # Config, mocks, contratos e utilidades compartilhadas
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
      → Core HTTP/Query/Session (core/)
        → auraxis-api (fonte única de verdade)
```

## Convenções de componentes

- Componentes em `components/` são puros (sem efeitos colaterais diretos).
- Lógica de estado vai em hooks ou providers, não em componentes.
- Telas (`app/`) devem conter apenas lógica de view e composição.
- Nenhuma chamada HTTP direta em componentes — sempre via hook ou service.
- `lib/` e `hooks/` legados existem apenas como camada de compatibilidade temporária.

## Decisões de arquitetura

| Decisão | Escolha | Motivo |
|:--------|:--------|:-------|
| Navegação | Expo Router (file-based) | Padrão Expo SDK 54, convenção clara |
| Storage sensível | expo-secure-store | Keychain (iOS) / Keystore (Android) |
| HTTP | Axios | Interceptors, timeout, mock adapter e compatibilidade com o web |
| Auth tokens | expo-secure-store | Nunca AsyncStorage sem criptografia |
| Tipagem | strict: true | Sem `any`, inferência máxima |
| Organização | `core` + `features` + `shared` | Isolar runtime transversal e manter views finas |
| Mocks | adapter central de API | Permite scaffold rápido do app sem depender sempre do backend |

## Contratos com auraxis-api

- Consumir apenas endpoints documentados em `auraxis-api/schema.graphql` ou OpenAPI spec.
- Não criar lógica de negócio no mobile — apenas apresentação e orchestração de chamadas.
- Versionar chamadas de API — não assumir contrato estável sem versão.

## Plataformas suportadas

- **iOS**: target mínimo a definir (sugestão: iOS 15+)
- **Android**: target mínimo a definir (sugestão: API 31+)
- **Web**: via expo-web-browser (funcionalidade reduzida — não é o foco)
