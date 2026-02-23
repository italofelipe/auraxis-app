# architecture.md — auraxis-app

## Stack

| Camada | Tecnologia | Versão |
|:-------|:-----------|:-------|
| Framework | Expo SDK 54 | 54.x |
| Runtime | React Native | 0.81.5 |
| Navegação | Expo Router | v4 (file-based) |
| Linguagem | TypeScript | strict mode |
| Lint | ESLint + eslint-config-expo | latest |
| Testes | Jest + React Native Testing Library | latest |
| Storage seguro | expo-secure-store | latest |
| Build | EAS Build | (a configurar — APP5) |
| OTA | EAS Update | (a configurar) |

## Estrutura de diretórios

```
auraxis-app/
  app/           # Telas e navegação (Expo Router — file-based)
    (auth)/      # Grupo de rotas autenticadas
    (public)/    # Grupo de rotas públicas (login, registro)
    _layout.tsx  # Root layout
  components/    # Componentes React Native reutilizáveis
  constants/     # Constantes, temas, cores
  hooks/         # Custom hooks (ex: useAuth, useTransactions)
  services/      # Clientes HTTP por domínio (ex: auth.service.ts)
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
  → Hooks (hooks/)
    → Services (services/ — HTTP calls para auraxis-api)
      → auraxis-api (fonte única de verdade)
```

## Convenções de componentes

- Componentes em `components/` são puros (sem efeitos colaterais diretos).
- Lógica de estado vai em hooks ou contextos, não em componentes.
- Telas (`app/`) orquestram — não contêm lógica de negócio.
- Nenhuma chamada HTTP direta em componentes — sempre via hook ou service.

## Decisões de arquitetura

| Decisão | Escolha | Motivo |
|:--------|:--------|:-------|
| Navegação | Expo Router (file-based) | Padrão Expo SDK 54, convenção clara |
| Storage sensível | expo-secure-store | Keychain (iOS) / Keystore (Android) |
| HTTP | fetch nativo ou axios | A definir em APP2 |
| Auth tokens | expo-secure-store | Nunca AsyncStorage sem criptografia |
| Tipagem | strict: true | Sem `any`, inferência máxima |

## Contratos com auraxis-api

- Consumir apenas endpoints documentados em `auraxis-api/schema.graphql` ou OpenAPI spec.
- Não criar lógica de negócio no mobile — apenas apresentação e orchestração de chamadas.
- Versionar chamadas de API — não assumir contrato estável sem versão.

## Plataformas suportadas

- **iOS**: target mínimo a definir (sugestão: iOS 15+)
- **Android**: target mínimo a definir (sugestão: API 31+)
- **Web**: via expo-web-browser (funcionalidade reduzida — não é o foco)
