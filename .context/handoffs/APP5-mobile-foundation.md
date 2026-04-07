# APP5 - Scaffold base do app mobile

## O que foi feito
- reli os contratos canônicos da `auraxis-api` para `auth`, `user/bootstrap`, `subscriptions`, `dashboard`, `wallet`, `alerts`, `goals` e `observability`;
- mapeei o catálogo de endpoints consumíveis do MVP1 em [`shared/contracts/api-endpoint-catalog.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/contracts/api-endpoint-catalog.ts);
- criei a fundação `core/` do app com:
  - runtime config em [`shared/config/runtime.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/config/runtime.ts);
  - cliente Axios canônico com interceptors, header de contrato e mock mode em [`core/http/http-client.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/http/http-client.ts);
  - tratamento tipado de erro HTTP em [`core/http/api-error.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/http/api-error.ts);
  - query layer base em [`core/query/query-client.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/query/query-client.ts), [`core/query/create-api-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/query/create-api-query.ts) e [`core/query/create-api-mutation.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/query/create-api-mutation.ts);
  - sessao segura com persistencia compatível com o legado em [`core/session/session-storage.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/session/session-storage.ts) e [`core/session/session-store.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/session/session-store.ts);
  - provider de runtime em [`core/providers/runtime-provider.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/providers/runtime-provider.tsx);
- criei contratos, mocks, services e hooks por domínio em `features/` para:
  - `auth`
  - `bootstrap`
  - `subscription`
  - `dashboard`
  - `wallet`
  - `alerts`
  - `goals`
  - `observability`
- conectei o novo provider em [`components/providers/app-providers.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/components/providers/app-providers.tsx);
- removi o bootstrap direto do layout e deixei essa responsabilidade no provider raiz em [`app/_layout.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/app/_layout.tsx);
- mantive compatibilidade com o scaffold anterior via wrappers em:
  - [`config/query-client.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/config/query-client.ts)
  - [`stores/session-store.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/stores/session-store.ts)
  - [`hooks/use-session-bootstrap.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/use-session-bootstrap.ts)
  - [`lib/http-client.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/lib/http-client.ts)
  - [`lib/secure-storage.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/lib/secure-storage.ts)
  - [`lib/auth-api.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/lib/auth-api.ts)
  - [`hooks/mutations/use-auth-mutations.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/mutations/use-auth-mutations.ts)
- alinhei o contexto do app com a nova arquitetura em [`architecture.md`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/.context/architecture.md).
- completei a segunda camada da fundação com:
  - guards e registro tipado de rotas em [`core/navigation/routes.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/navigation/routes.ts), [`core/navigation/route-guards.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/navigation/route-guards.ts) e [`core/navigation/use-route-guards.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/navigation/use-route-guards.ts);
  - app shell store e bootstrap de startup/acessibilidade em [`core/shell/app-shell-store.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/shell/app-shell-store.ts), [`core/shell/use-app-startup.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/shell/use-app-startup.ts) e [`core/shell/use-accessibility-preferences.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/shell/use-accessibility-preferences.ts);
  - query keys canônicas em [`core/query/query-keys.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/query/query-keys.ts);
  - mapa tipado de contratos API em [`shared/contracts/api-contract-map.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/contracts/api-contract-map.ts), além de conectar os services a essa fonte única de paths;
  - base de tema semântico, motion tokens e hooks de animação em [`shared/theme/index.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/theme/index.ts), [`shared/theme/motion.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/theme/motion.ts) e [`shared/animations`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/animations);
  - base reutilizável de formulários/validação em [`shared/forms/use-app-form.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/forms/use-app-form.ts), [`shared/forms/api-form-errors.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/forms/api-form-errors.ts), [`features/auth/validators.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/features/auth/validators.ts) e [`features/subscription/validators.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/features/subscription/validators.ts);
  - primitives reutilizáveis extras em [`shared/components/app-heading.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/components/app-heading.tsx), [`shared/components/app-badge.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/components/app-badge.tsx), [`shared/components/app-stack.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/components/app-stack.tsx) e [`shared/components/app-form-message.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/components/app-form-message.tsx);
  - test providers desacoplados do runtime real em [`shared/testing/test-providers.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/testing/test-providers.tsx);
  - layouts `Expo Router` refatorados para manter `.tsx` mais finos e mover decisão de sessão/redirect para hooks.

## O que foi validado
- `npm run typecheck`
- `npm run lint`
- `npm run policy:check`
- `npm run contracts:check`
- `npx jest core/http/http-client.test.ts shared/mocks/api/router.test.ts lib/auth-api.test.ts __tests__/app/index-screen.test.tsx --runInBand`
- `npx jest core/navigation/route-guards.test.ts core/shell/use-app-startup.test.tsx shared/contracts/api-contract-map.test.ts shared/forms/api-form-errors.test.ts shared/forms/use-app-form.test.tsx shared/theme/motion.test.ts features/auth/validators.test.ts features/subscription/validators.test.ts shared/components/app-badge.test.tsx shared/components/app-heading.test.tsx components/providers/app-providers.test.tsx __tests__/app/index-screen.test.tsx --runInBand`
- `npm run quality-check`
- `git diff --check`

## Riscos pendentes
- o `openapi.snapshot.json` do app continua atrasado em relação ao backend real; o scaffold novo não depende mais dele cegamente, mas ainda vale regenerar esse baseline em um próximo bloco;
- existem telas e hooks legados que ainda consomem `lib/*` e contratos simplificados; a camada de compatibilidade segura esse bloco, mas a migração real para `features/*` ainda precisa acontecer;
- os mocks cobrem os fluxos-base do MVP1, mas ainda não representam todos os endpoints de `transactions`, `shared-entries` e `fiscal`;
- o app continua com `node 25.x`, o que não é a escolha mais conservadora para estabilidade da esteira.
- vários screens atuais ainda usam estilos/raw components herdados do scaffold inicial; a fundação nova está pronta, mas a limpeza visual/estrutural das views virá no próximo slice.

## Proximo passo
- sincronizar o baseline de contratos OpenAPI do app com o estado mais recente da `auraxis-api`;
- abrir o próximo slice do app para `auth + bootstrap + plans/paywall`, agora já sobre `route guards`, `apiContractMap`, `queryKeys`, `theme/motion` e `shared/forms`;
- usar `shared/testing/test-providers.tsx` como base para os testes das próximas telas e hooks visuais.

---

## Update - APP FND-01

### O que foi feito
- sincronizei o snapshot OpenAPI do app com a `auraxis-api` local via [`scripts/contracts-sync-local-api.cjs`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/scripts/contracts-sync-local-api.cjs), atualizando:
  - [`contracts/openapi.snapshot.json`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/contracts/openapi.snapshot.json)
  - [`shared/types/generated/openapi.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/types/generated/openapi.ts)
- ampliei o catálogo e o mapa canônico de contratos em:
  - [`shared/contracts/api-endpoint-catalog.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/contracts/api-endpoint-catalog.ts)
  - [`shared/contracts/api-contract-map.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/contracts/api-contract-map.ts)
- adicionei o domínio canônico de `entitlements` em [`features/entitlements`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/features/entitlements) e conectei query keys em [`core/query/query-keys.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/query/query-keys.ts);
- removi consumo ativo de rotas soltas ou libs legadas dos fluxos já em uso, migrando para services/contratos canônicos em:
  - [`features/dashboard/services/dashboard-service.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/features/dashboard/services/dashboard-service.ts)
  - [`features/alerts/services/alerts-service.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/features/alerts/services/alerts-service.ts)
  - [`hooks/queries/use-alerts-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/queries/use-alerts-query.ts)
  - [`hooks/queries/use-alert-preferences-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/queries/use-alert-preferences-query.ts)
  - [`hooks/queries/use-dashboard-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/queries/use-dashboard-query.ts)
  - [`hooks/queries/use-entitlement-check-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/queries/use-entitlement-check-query.ts)
  - [`hooks/queries/use-entitlement-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/queries/use-entitlement-query.ts)
  - [`hooks/queries/use-subscription-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/queries/use-subscription-query.ts)
  - [`hooks/queries/use-wallet-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/queries/use-wallet-query.ts)
  - [`hooks/mutations/use-delete-alert-mutation.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/mutations/use-delete-alert-mutation.ts)
  - [`hooks/mutations/use-mark-read-mutation.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/mutations/use-mark-read-mutation.ts)
  - [`hooks/mutations/use-update-preference-mutation.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/hooks/mutations/use-update-preference-mutation.ts)
- movi a configuração de URLs web para a trilha compartilhada em [`shared/config/web-urls.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/config/web-urls.ts), mantendo [`lib/web-urls.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/lib/web-urls.ts) só como compatibilidade;
- adicionei guardrails para falhar cedo localmente:
  - [`scripts/check-api-contract-governance.cjs`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/scripts/check-api-contract-governance.cjs) bloqueia imports ativos de `@/lib/*-api` e strings soltas de endpoint;
  - [`package.json`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/package.json) agora acopla esse check ao `policy:check` e ao `lint-staged`;
- alinhei a compatibilidade de `entitlements` para suportar shape moderno e legado em:
  - [`types/contracts/entitlement.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/types/contracts/entitlement.ts)
  - [`lib/entitlements-api.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/lib/entitlements-api.ts)

### O que foi validado
- `npm run contracts:sync:api-local`
- `npm run policy:check`
- `npm run contracts:check`
- `npm run typecheck`
- `npx jest shared/contracts/api-contract-map.test.ts hooks/queries/use-alerts-query.spec.ts hooks/queries/use-subscription-query.spec.ts lib/web-urls.test.ts lib/entitlements-api.test.ts --runInBand`
- `npm run quality-check`
- `git diff --check`

### Riscos pendentes
- o backend ainda não publica todas as rotas de `alerts` e `subscriptions` no snapshot OpenAPI, então o app mantém uma lista explícita de gaps conhecidos em [`shared/contracts/api-contract-map.test.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/contracts/api-contract-map.test.ts);
- a camada legada `lib/`, `hooks/` e `stores/` ainda existe, mas agora ficou restrita a compatibilidade. A remoção total entra no próximo bloco;
- ainda faltam scaffolds canônicos para `transactions`, `shared-entries`, `fiscal`, `profile` e `questionnaire`.

### Proximo passo
- seguir para `APP FND-02`, fechando shell, sessão, lifecycle, deep links e retorno de checkout;
- manter o guardrail de contratos ativo para que qualquer novo consumo da API já nasça tipado e preso ao catálogo canônico.

### Addendum - Gitleaks / contract hygiene
- o PR `#210` revelou um atrito estrutural no CI: exemplos realistas demais de `token`, `refresh_token`, JWT e `X-Request-ID` dentro do snapshot OpenAPI estavam acionando `Gitleaks`;
- a correção foi feita na raiz do fluxo de contratos:
  - [`scripts/openapi-secret-hygiene.cjs`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/scripts/openapi-secret-hygiene.cjs) sanitiza exemplos sensíveis antes do snapshot ser versionado;
  - [`scripts/check-openapi-secret-hygiene.cjs`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/scripts/check-openapi-secret-hygiene.cjs) falha cedo localmente quando o snapshot ou os tipos gerados carregam exemplos que parecem segredo;
  - [`scripts/contracts-sync.cjs`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/scripts/contracts-sync.cjs) agora escreve apenas o snapshot já sanitizado;
  - [`scripts/contracts-check.cjs`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/scripts/contracts-check.cjs) valida essa higiene como parte do fluxo de contratos;
  - [`lint-staged.config.js`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/lint-staged.config.js) e [`.husky/pre-push`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/.husky/pre-push) foram endurecidos para executar esse guardrail antes do CI.
- validação do fix:
  - `npm run contracts:sync:api-local`
  - `node scripts/check-openapi-secret-hygiene.cjs`
  - `npm run policy:check`
  - `npm run contracts:check`
  - busca explícita pelos literais reportados pelo Gitleaks (`rg`) retornando vazio em `contracts/openapi.snapshot.json` e `shared/types/generated/openapi.ts`
