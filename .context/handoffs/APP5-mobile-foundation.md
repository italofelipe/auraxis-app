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

## O que foi validado
- `npm run typecheck`
- `npm run lint`
- `npm run policy:check`
- `npm run contracts:check`
- `npx jest core/http/http-client.test.ts shared/mocks/api/router.test.ts lib/auth-api.test.ts __tests__/app/index-screen.test.tsx --runInBand`
- `git diff --check`

## Riscos pendentes
- o `openapi.snapshot.json` do app continua atrasado em relação ao backend real; o scaffold novo não depende mais dele cegamente, mas ainda vale regenerar esse baseline em um próximo bloco;
- existem telas e hooks legados que ainda consomem `lib/*` e contratos simplificados; a camada de compatibilidade segura esse bloco, mas a migração real para `features/*` ainda precisa acontecer;
- os mocks cobrem os fluxos-base do MVP1, mas ainda não representam todos os endpoints de `transactions`, `shared-entries` e `fiscal`;
- o app continua com `node 25.x`, o que não é a escolha mais conservadora para estabilidade da esteira.

## Proximo passo
- começar a migrar as telas públicas e privadas para consumir os hooks de `features/*`, sem colocar regra de negócio em `.tsx`;
- sincronizar o baseline de contratos OpenAPI do app com o estado mais recente da `auraxis-api`;
- abrir o próximo slice do app para `auth + bootstrap + plans/paywall` com base nessa fundação.
