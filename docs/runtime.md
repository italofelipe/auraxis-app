# Runtime — auraxis-app

Documenta o runtime canônico do aplicativo móvel (engine JS, telemetria,
secrets de produção). Atualizar quando alguma decisão estrutural mudar.

## JS engine: Hermes (canônico)

`app.json` declara `expo.jsEngine = "hermes"` em todas as plataformas.
Hermes é a engine oficial do app — JSC não é suportado.

Por que Hermes:
- Boot até ~2× mais rápido vs JSC em iOS/Android.
- Menor footprint de memória em-runtime.
- Bytecode pré-compilado (`.hbc`) embarcado no bundle.
- New Architecture (Fabric/TurboModules) é homologado contra Hermes.

Smoke test pós-build:
```bash
npx expo run:ios
npx expo run:android
```

Validar nos logs de boot a linha `engineName: 'Hermes'` (Sentry runtime
context confirma o mesmo, ver `core/telemetry/operational-context.ts`).

## Sentry — wiring de produção

`app/services/sentry.ts::initSentry()` é invocado pelo
`core/shell/use-app-startup.ts` antes do primeiro render do `<Stack>`.

### DSN

A DSN é resolvida em ordem de precedência:

1. `process.env.EXPO_PUBLIC_SENTRY_DSN` — **canônico**. Inlined pelo
   bundler em build time. Fonte: EAS secret.
2. `expoConfig.extra.sentryDsn` — legado, mantido apenas para builds
   locais antigos. Não usar em produção.

Definir o EAS secret:
```bash
eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_SENTRY_DSN \
  --value "https://<key>@<org>.ingest.sentry.io/<project>" \
  --type string
```

Depois, qualquer `eas build --profile <preview|production>` que rodar
vai injetar o secret no bundle. **Nunca** comitar a DSN em `app.json`,
`.env*`, ou variáveis de CI fora do EAS secret manager.

### Environment

`environment` segue a mesma cadeia: `EXPO_PUBLIC_APP_ENV` →
`extra.appEnv` → fallback `"development"`. Usar `production` /
`preview` / `development` conforme o profile EAS.

### Sanitização (LGPD)

`sanitizeSentryEvent` em `app/services/sentry.ts` remove `user.email` e
`user.ip_address`, redacta cabeçalhos sensíveis (`Authorization`,
`Cookie`, `X-Observability-Key`) e normaliza URLs de deep link via
`sanitizeAppUrl`. `sendDefaultPii: false` garante que o SDK não envia
PII automático.

Para validar que a sanitização continua funcionando:

```bash
# 1. Forçar um crash em build de preview
throw new Error("sentry-smoketest");

# 2. Conferir o evento no projeto Sentry "auraxis-app"
# Esperado: stack trace OK, mas sem email/IP/Authorization no payload.
```

### Disabled in dev

`Sentry.init({ enabled: !__DEV__ })` mantém o SDK silencioso durante
`expo start`. Só builds de preview/production reportam.

## Component dev catalog

Galeria interna de componentes em `app/(legal)/dev-catalog.tsx`,
alcançável via deep link `auraxisapp:///dev-catalog` em builds de
desenvolvimento. Cobre os primitivos compartilhados (`AppButton`,
`AppInputField`, `AppMetricCard`, `AppEmptyState`, `AppSkeletonBlock`).

Mora no grupo `(legal)` (acesso unrestricted) por simplicidade — a
proteção real é o gate `__DEV__` dentro do componente. Em builds de
produção a rota renderiza apenas um placeholder "Catalogo nao
disponivel". Pasta `_*` em Expo Router é privada (sem rota), por isso
o catálogo precisa morar em pasta visível ao roteador.

Storybook for React Native foi avaliado e descartado por hora: dependência
nativa pesada, builds frágeis no SDK 54 + new arch. O catálogo interno
cobre o caso de uso (visualizar variações de componentes em isolamento)
sem custo de manutenção do ecossistema.
