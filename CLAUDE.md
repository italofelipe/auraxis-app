# CLAUDE.md — auraxis-app

## Identidade

Repositório do aplicativo mobile do Auraxis.
Stack: React Native + Expo SDK 54 + TypeScript.

Este repo é um **submodule** de `auraxis-platform`.
Sempre trabalhe a partir da raiz da platform quando possível.

## Session Bootstrap (MANDATORY — execute em ordem)

Antes de qualquer ação, leia a partir da platform:

1. `../../.context/06_context_index.md` — índice de contexto
2. `../../.context/07_steering_global.md` — governança global
3. `../../.context/08_agent_contract.md` — contrato de agente
4. Este arquivo — diretiva do repo mobile
5. `product.md` — visão e escopo ativo do app
6. `.context/templates/feature_card_template.md` e `.context/templates/delivery_report_template.md` — artefatos SDD obrigatórios

> **Backlog e status** são gerenciados exclusivamente no **GitHub Projects**.
> Não leia `01_status_atual.md`, `02_backlog_next.md` ou `tasks.md` — esses arquivos estão deprecated.

## Estrutura do repo

```
auraxis-app/
  app/           # Telas e navegação (Expo Router)
  core/          # Runtime canônico (providers, telemetry, http, sessão, shell)
  features/      # Domínios de produto (components/hooks/services por feature)
  shared/        # Componentes, types, validators, utils e theme compartilhados
  stores/        # Estado global de cliente
  assets/        # Imagens, fontes, ícones
  scripts/       # Utilitários de desenvolvimento
```

## Stack e ferramentas

- **Framework**: Expo SDK 54 / React Native 0.81.5
- **Navegação**: Expo Router (file-based)
- **Linguagem**: TypeScript strict
- **Lint**: ESLint (eslint-config-expo)
- **Runtime**: iOS, Android, Web (via expo-web-browser)

## Operação local

```bash
# Instalar dependências
npm install

# Iniciar dev server
npm start          # ou expo start

# Plataformas específicas
npm run android
npm run ios
npm run web

# Lint
npm run lint

# Verificação de qualidade completa (paridade com CI)
npm run quality-check
```

## Quality gates

`npm run quality-check` é o comando canônico de CI-parity. Ele executa, em sequência:

1. **lint** — ESLint com `--max-warnings 0`
2. **typecheck** — `tsc --noEmit` (TypeScript strict)
3. **policy:check** — governance scripts (frontend, contracts, route boundaries, secret hygiene, sonar config, runtime release, client security, client logging)
4. **contracts:check** — validação dos contratos de API contra o OpenAPI snapshot
5. **test:coverage** — Jest com threshold de cobertura ≥ 85%

Sempre rode `npm run quality-check` antes de abrir PR. O CI executa exatamente essa sequência.

## Convenções

- **Commits**: Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`)
- **Branch**: `type/scope-descricao` (ex: `feat/auth-login-screen`)
- **Nunca** commitar direto em `master`
- **Nunca** expor tokens, keys ou segredos em código

## Limites operacionais

### Pode fazer autonomamente
- Ler qualquer arquivo do repo
- Criar/editar componentes, telas, hooks
- Atualizar documentação local
- Criar branches de feature

### Deve perguntar antes
- Adicionar dependências nativas (que exigem rebuild)
- Mudanças em `app.json` (afeta build e stores)
- Mudanças de navegação estrutural

### Nunca fazer
- Commitar direto em `master`
- Expor secrets ou chaves de API em código

## TDD — obrigatório para lógica de negócio

Antes de implementar qualquer screen controller, service ou validator, escreva o teste que vai falhar primeiro.

### Fluxo obrigatório

1. Leia os critérios de aceite da issue
2. Escreva o teste (deve falhar com `npm test`)
3. Implemente o mínimo para o teste passar
4. Refatore mantendo o teste verde

### Onde TDD é obrigatório

- `features/*/hooks/use-*-screen-controller.ts` — toda lógica derivada
- `features/*/services/*-service.ts` — toda chamada HTTP e transformação
- `features/*/validators.ts` — todo schema Zod
- `shared/*/` — todo utilitário e helper compartilhado

### Onde TDD é recomendado (não obrigatório)

- Componentes React Native puros (`.tsx`) sem lógica de negócio
- Telas de composição (`.screen.tsx`)

### Onde TDD não se aplica

- Arquivos de configuração e constantes
- Tipos TypeScript puros
- Mocks e factories de teste

### Exemplo

```typescript
// ✅ CORRETO — teste primeiro
// features/transactions/validators.test.ts
it('rejects transaction with negative amount', () => {
  const result = transactionSchema.safeParse({ amount: -100, description: 'test' })
  expect(result.success).toBe(false)
})
// → implementar transactionSchema para passar

// ❌ ERRADO — implementar primeiro
```

## Mutation testing (on-demand, Stryker)

Verifica se os testes existentes detectam mutações no código. Complementar ao TDD.

```bash
npm run test:mutation                  # run completo
npm run test:mutation:features         # apenas features/** (mais rápido)
```

Score alvo: >= 70%. Rodar semanalmente ou antes de merge de validators/calculators/services.
Relatório HTML gerado em `reports/mutation/index.html`.
Config em `stryker.config.mjs` — foca em validators, calculators e shared/utils.


## Integração com platform

Este repo é orchestrado por `auraxis-platform`.
Handoffs e decisões de arquitetura ficam em `auraxis-platform/.context/`.
Contratos de API são definidos em `auraxis-api`.

## Arquitetura de navegação (Expo Router)

- Rotas em `app/` seguem file-based routing: `app/(tabs)/dashboard.tsx` → `/dashboard`
- Stack navigators via `app/(stack)/` quando há fluxo de sub-telas
- Rotas protegidas: middleware em `app/_layout.tsx` redireciona para `/login` se sem sessão
- Deep links configurados em `app.json` sob `expo.scheme`
- **Nunca** use `react-navigation` diretamente — o Expo Router é a abstração canônica

## Mapa de estado

| Responsabilidade | Solução | Localização |
|------------------|---------|-------------|
| Server state (API data) | TanStack Query | `features/*/hooks/use-*-query.ts` |
| Session / auth | Session store | `core/session/` |
| UI global (toasts, modais) | Providers | `core/providers/` |
| Feature-local UI | `useState` / `useReducer` | dentro do screen controller |
| Persistência offline | AsyncStorage via query | `core/query/` |

**Regra:** nunca sincronizar manualmente server state com estado local.
Use `queryClient.invalidateQueries()` após mutações.

## Design system — shared/components disponíveis

Antes de criar um novo componente, verifique `shared/components/`:
- `shared/skeletons/` — loading placeholders para todas as telas principais
- `shared/feedback/` — estados de erro, empty state, success
- `shared/forms/` — inputs, selects, form wrappers com validação Zod
- `shared/animations/` — wrappers de Reanimated para transições padrão
- `shared/theme/` — tokens de cor, tipografia, espaçamento (via Tamagui)

**Sempre reutilize. Nunca crie duplicata de componente existente.**

## Gotchas de React Native / Expo

### Dependências nativas
- Adicionar dependência com módulo nativo (`expo-camera`, `expo-*`, libs com código Swift/Kotlin) **exige rebuild** do app
- Para expo-managed workflow: `npx expo install <dep>` (não `npm install`) garante versão compatível com SDK 54
- Após adicionar dep nativa: comunicar ao usuário que é necessário novo build (`eas build --profile development`)

### Não fazer em CI / agente
- `expo prebuild` — regenera `ios/` e `android/`, pode sobrescrever customizações
- `eas build` — builds levam 10-30 min e consomem créditos EAS

### Bridge e código nativo
- Nunca escrever código Swift/Kotlin/Objective-C sem instrução explícita do usuário
- Módulos nativos customizados ficam em `modules/` (Expo Modules API)

### app.json / eas.json
- Modificações em `app.json` afetam o bundle ID, permissões e configurações de store
- **Sempre perguntar antes de modificar `app.json` ou `eas.json`**

## CI — gotchas conhecidos

- O CI usa `npm ci --ignore-scripts` (sem scripts de install)
- Jest roda com `--testEnvironment node` para testes de service/hook
- Não há E2E automatizado em CI ainda — testes manuais via Expo Go ou dev client
- Arquivo `.env.test` pode ser necessário para testes de integração local — não commitar

## Limites operacionais (detalhado)

### Pode fazer autonomamente
- Criar/editar componentes, telas, hooks, services, validators
- Adicionar testes unitários e de integração
- Atualizar i18n (`shared/i18n/`)
- Criar branches e commits convencionais
- Rodar `npm run quality-check`
- Criar/atualizar feature flags em `shared/feature-flags/`

### DEVE perguntar antes
- Adicionar qualquer dependência com código nativo
- Modificar `app.json`, `app.config.js`, `eas.json`
- Adicionar nova rota em `app/` que mude a estrutura de navegação
- Modificar `core/providers/` (afeta toda a app)
- Mudanças que afetem contratos com auraxis-api

### NUNCA fazer
- `git add .` ou `git add -A`
- Commitar direto em main
- Expor tokens, segredos ou chaves em código
- Modificar `node_modules/` diretamente
- Rodar `expo prebuild` ou `eas build` sem instrução explícita

## SDD (obrigatório para features)

- Antes de codar: garantir que a task/issue no GitHub Projects tenha critérios de aceite claros.
  Registrar contexto adicional em `.context/reports/` se necessário.
- Ao finalizar bloco: registrar Delivery Report em `.context/reports/`.
- Se interromper sessão: registrar handoff em `.context/handoffs/`.
