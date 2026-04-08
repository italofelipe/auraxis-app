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

---

## Update - APP FND-02

### O que foi feito
- consolidei o startup do app para hidratar sessão junto com fontes, Sentry e `SplashScreen` em [`core/shell/use-app-startup.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/shell/use-app-startup.ts);
- deixei o bootstrap de sessão idempotente no store em [`core/session/session-store.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/session/session-store.ts), reduzindo risco de drift entre runtime e telas;
- expandi o shell store com estado operacional de lifecycle e retorno de checkout em [`core/shell/app-shell-store.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/shell/app-shell-store.ts);
- fechei a trilha canônica de deep links e retorno de checkout em [`core/navigation/deep-linking.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/navigation/deep-linking.ts), apoiada pelos novos env/runtime keys em [`shared/config/runtime.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/shared/config/runtime.ts);
- adicionei a orquestração de lifecycle e revalidação de runtime em:
  - [`core/shell/runtime-revalidation.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/shell/runtime-revalidation.ts)
  - [`core/shell/use-runtime-lifecycle.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/shell/use-runtime-lifecycle.ts)
  - [`core/providers/runtime-provider.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/core/providers/runtime-provider.tsx)
- criei a fundação do checkout hospedado mobile/web em [`features/subscription/services/hosted-checkout-service.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/features/subscription/services/hosted-checkout-service.ts);
- endureci o gate local para runtime novo incluindo cobertura explícita em [`jest.config.js`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/jest.config.js), para que esse tipo de drift falhe localmente antes do CI.

### O que foi validado
- `npm run typecheck`
- `npx jest core/navigation/deep-linking.test.ts core/shell/runtime-revalidation.base.test.ts core/shell/runtime-revalidation.errors.test.ts core/shell/use-app-startup.test.tsx core/shell/use-runtime-lifecycle.base.test.tsx core/shell/use-runtime-lifecycle.edge.test.tsx features/subscription/services/hosted-checkout-service.test.ts --runInBand`
- `npm run quality-check`
- `git diff --check`

### Riscos pendentes
- o scaffold de retorno de checkout ainda não está consumido por views; neste bloco ficou pronta só a fundação de runtime, store e serviço;
- as telas atuais ainda usam parte da arquitetura antiga de layout/composição, então a consolidação visual/estrutural continua no próximo bloco;
- o app ainda precisa fechar deep links funcionais de produto e navegação externa por rota real quando as primeiras telas forem migradas para o caminho canônico.

### Proximo passo
- seguir para `APP FND-03`, fechando primitives, composição visual, async states e wrappers reutilizáveis para deixar `.tsx` apenas como view;
- depois avançar para `APP FND-04`, completando os domínios que ainda faltam antes da primeira feature entregue.

---

## Update - APP FND-03A

### O que foi feito
- movi o provider raiz canônico para [`core/providers/app-providers.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/core/providers/app-providers.tsx), deixando [`components/providers/app-providers.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/components/providers/app-providers.tsx) apenas como compatibilidade temporária;
- atualizei [`app/_layout.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/_layout.tsx) e [`app/index.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/index.tsx) para dependerem só da trilha canônica do runtime;
- criei controllers de tela em `features/*/hooks` para os fluxos já migrados:
  - [`use-login-screen-controller.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/auth/hooks/use-login-screen-controller.ts)
  - [`use-forgot-password-screen-controller.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/auth/hooks/use-forgot-password-screen-controller.ts)
  - [`use-dashboard-screen-controller.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/dashboard/hooks/use-dashboard-screen-controller.ts)
  - [`use-subscription-screen-controller.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/subscription/hooks/use-subscription-screen-controller.ts)
  - [`use-wallet-screen-controller.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/wallet/hooks/use-wallet-screen-controller.ts)
  - [`use-alerts-screen-controller.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/alerts/hooks/use-alerts-screen-controller.ts)
- levei as mutations de alertas para a trilha canônica em [`use-alerts-mutations.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/alerts/hooks/use-alerts-mutations.ts);
- migrei as rotas abaixo para dependerem só de `features/*`, `core/*` e `shared/*`, removendo consumo direto de `hooks/*` legados:
  - [`app/(public)/login.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/(public)/login.tsx)
  - [`app/(public)/forgot-password.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/(public)/forgot-password.tsx)
  - [`app/(private)/dashboard.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/(private)/dashboard.tsx)
  - [`app/(private)/assinatura.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/(private)/assinatura.tsx)
  - [`app/(private)/carteira.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/(private)/carteira.tsx)
  - [`app/(private)/alertas.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/(private)/alertas.tsx)
- adicionei o guardrail local [`scripts/check-app-route-boundaries.cjs`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/scripts/check-app-route-boundaries.cjs) e o liguei ao `policy:check`/`lint-staged`, para falhar cedo se `app/` voltar a importar `components/`, `hooks/`, `lib/` ou `stores/` legados.

### O que foi validado
- `node scripts/check-app-route-boundaries.cjs`
- `npm run typecheck`
- `npm run policy:check`
- `npm run lint`
- `npx jest components/providers/app-providers.test.tsx __tests__/app/tools-screen.test.tsx __tests__/app/installment-vs-cash-screen.test.tsx --runInBand`
- `npm run quality-check`
- `git diff --check`

### Riscos pendentes
- `app/(private)/ferramentas.tsx` e `app/(private)/installment-vs-cash.tsx` ainda estão na allowlist temporária do guardrail porque continuam dependendo da trilha antiga de `tools`;
- `components/`, `hooks/`, `lib/` e `stores/` ainda existem como camada de compatibilidade em outras superfícies, então o legado ainda não foi removido do repo por completo;
- a próxima etapa precisa atacar `tools/installment-vs-cash` e depois consolidar primitives/wrappers para diminuir ainda mais o uso de componentes herdados.

### Proximo passo
- seguir no `FND-03A` migrando `tools` e `installment-vs-cash` para `features/*`;
- depois avançar para `FND-03B`, consolidando primitives e wrappers visuais até `app/` ficar apenas com composição de tela.

---

## Update - APP FND-03A (completion)

### O que foi feito
- concluí a migração do domínio `tools` para a arquitetura canônica em [`features/tools`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools), incluindo:
  - services em [`services/tools-service.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/services/tools-service.ts) e [`services/installment-vs-cash-service.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/services/installment-vs-cash-service.ts);
  - queries/mutations/controllers em [`hooks/use-tools-catalog-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/hooks/use-tools-catalog-query.ts), [`hooks/use-tools-screen-controller.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/hooks/use-tools-screen-controller.ts), [`hooks/use-installment-vs-cash-history-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/hooks/use-installment-vs-cash-history-query.ts), [`hooks/use-installment-vs-cash-mutations.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/hooks/use-installment-vs-cash-mutations.ts) e [`hooks/use-installment-vs-cash-screen-controller.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/hooks/use-installment-vs-cash-screen-controller.ts);
  - componentes de domínio em [`components/installment-vs-cash-form.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/components/installment-vs-cash-form.tsx), [`components/installment-vs-cash-history-list.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/components/installment-vs-cash-history-list.tsx) e [`components/installment-vs-cash-result-card.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/tools/components/installment-vs-cash-result-card.tsx);
- movi a checagem de entitlement usada por `tools` para a trilha canônica em [`features/entitlements/hooks/use-entitlement-check-query.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/features/entitlements/hooks/use-entitlement-check-query.ts);
- migrei as duas últimas rotas que ainda dependiam do legado:
  - [`app/(private)/ferramentas.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/(private)/ferramentas.tsx)
  - [`app/(private)/installment-vs-cash.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/app/(private)/installment-vs-cash.tsx)
- removi o allowlist do guardrail em [`scripts/check-app-route-boundaries.cjs`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03a-legacy-removal/scripts/check-app-route-boundaries.cjs), então agora qualquer import de `components/`, `hooks/`, `lib/` ou `stores/` dentro de `app/` quebra localmente antes do CI;
- eliminei os arquivos legados do domínio antigo (`components/tools/*`, `hooks/use-installment-vs-cash-controller.ts`, `hooks/queries/use-tools-query.ts`, `hooks/queries/use-installment-vs-cash-history-query.ts`, `hooks/mutations/use-installment-vs-cash-mutations.ts`, `lib/tools-api.ts`, `lib/installment-vs-cash-api.ts`) e atualizei os testes/cobertura para a nova topologia.

### O que foi validado
- `node scripts/check-app-route-boundaries.cjs`
- `npm run typecheck`
- `npm run lint`
- `npm run policy:check`
- `npx jest features/tools/components/installment-vs-cash-components.test.tsx __tests__/app/tools-screen.test.tsx __tests__/app/installment-vs-cash-screen.test.tsx features/tools/hooks/use-tools-catalog-query.test.ts features/tools/hooks/use-installment-vs-cash-history-query.test.ts features/tools/services/tools-service.test.ts features/tools/services/installment-vs-cash-service.test.ts --runInBand`
- `npm run quality-check`
- `git diff --check`

### Riscos pendentes
- o legado ainda existe em outras superfícies fora de `app/`, especialmente componentes utilitários e hooks antigos que não são mais importados pelas rotas, mas continuam no repo e precisarão ser reconciliados ao longo do programa de fundação;
- `installment-vs-cash` ainda carrega bastante lógica dentro do controller, agora no lugar certo, mas esse controller continua grande e deve ser decomposto no `FND-03C`;
- o domínio `tools` ainda usa strings de endpoint internas em seus services; isso será absorvido na trilha de catálogo/coverage de contratos do `FND-04B`.

### Proximo passo
- abrir `APP FND-03B` para consolidar primitives, forms e wrappers visuais até o app inteiro depender só de blocos reutilizáveis canônicos;
- em seguida entrar no `APP FND-03C` para fatiar controllers grandes, especialmente `installment-vs-cash`, e subir a cobertura da lógica de orquestração no mesmo padrão da fundação.

---

## Update - APP FND-03B

### O que foi feito
- consolidei wrappers visuais canônicos novos em:
  - [`shared/components/app-key-value-row.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/shared/components/app-key-value-row.tsx)
  - [`shared/components/app-toggle-row.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/shared/components/app-toggle-row.tsx)
- movi componentes de produto que ainda viviam em `components/` para a trilha canônica:
  - alertas em [`features/alerts/components/alert-record-card.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/alerts/components/alert-record-card.tsx) e [`features/alerts/components/alert-preference-row.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/alerts/components/alert-preference-row.tsx)
  - entitlement/paywall em [`features/entitlements/components/paywall-gate.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/entitlements/components/paywall-gate.tsx) e [`features/entitlements/hooks/use-feature-access.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/entitlements/hooks/use-feature-access.ts)
  - upgrade premium em [`features/subscription/components/upgrade-cta.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/subscription/components/upgrade-cta.tsx)
- atualizei as rotas e componentes de domínio para usar esses blocos reutilizáveis:
  - [`app/(private)/alertas.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/app/(private)/alertas.tsx)
  - [`app/(private)/assinatura.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/app/(private)/assinatura.tsx)
  - [`app/(private)/carteira.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/app/(private)/carteira.tsx)
  - [`features/tools/components/installment-vs-cash-form.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/tools/components/installment-vs-cash-form.tsx)
  - [`features/tools/components/installment-vs-cash-history-list.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/tools/components/installment-vs-cash-history-list.tsx)
- removi os componentes herdados de produto de `components/` e o hook legado [`hooks/use-feature-access.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/hooks/use-feature-access.ts), deixando ali apenas infraestrutura/template ainda fora do escopo deste slice;
- endureci o guardrail em [`scripts/check-frontend-governance.cjs`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/scripts/check-frontend-governance.cjs) para falhar cedo se o app voltar a importar esses blocos legados;
- alinhei a mutation de preferencias de alerta em [`features/alerts/hooks/use-alerts-mutations.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/alerts/hooks/use-alerts-mutations.ts) com o contrato canônico de `globalOptOut`;
- subi cobertura nova para os wrappers/gates/componentes canônicos em:
  - [`shared/components/app-key-value-row.test.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/shared/components/app-key-value-row.test.tsx)
  - [`shared/components/app-toggle-row.test.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/shared/components/app-toggle-row.test.tsx)
  - [`features/alerts/components/alert-record-card.test.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/alerts/components/alert-record-card.test.tsx)
  - [`features/alerts/components/alert-preference-row.test.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/alerts/components/alert-preference-row.test.tsx)
  - [`features/subscription/components/upgrade-cta.test.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/subscription/components/upgrade-cta.test.tsx)
  - [`features/entitlements/components/paywall-gate.test.tsx`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/entitlements/components/paywall-gate.test.tsx)
  - [`features/entitlements/hooks/use-feature-access.test.ts`](/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/_worktrees/app-fnd-03b-ui-foundation/features/entitlements/hooks/use-feature-access.test.ts)

### O que foi validado
- `npx jest shared/components/app-key-value-row.test.tsx shared/components/app-toggle-row.test.tsx features/alerts/components/alert-record-card.test.tsx features/alerts/components/alert-preference-row.test.tsx features/subscription/components/upgrade-cta.test.tsx features/entitlements/components/paywall-gate.test.tsx features/entitlements/hooks/use-feature-access.test.ts --runInBand`
- `npm run quality-check`
- `git diff --check`

### Riscos pendentes
- `components/` ainda guarda alguns blocos de infraestrutura/template (`haptic-tab`, `parallax-scroll-view`, `themed-*`, `ui/collapsible`) que não são mais trilha válida para UI de produto, mas ainda não foram reconciliados neste slice;
- a camada visual canônica melhorou bastante, porém ainda faltam wrappers mais ricos de section/list/empty state para reduzir ainda mais a variabilidade quando começarmos as primeiras telas finais;
- o próximo hotspot estrutural segue sendo a lógica de orquestração de telas e controllers maiores, especialmente no domínio `installment-vs-cash`.

### Proximo passo
- seguir para `APP FND-03C`, extraindo controladores de screen e removendo a lógica restante de view para que `.tsx` virem somente composição;
- depois abrir `APP FND-04A`, completando o scaffold dos domínios canônicos restantes do MVP1 antes da primeira feature real.
