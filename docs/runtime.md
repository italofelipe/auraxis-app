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

## PostHog — product analytics

`app/services/posthog.ts::initPostHog()` roda no startup logo depois de
`initSentry()`. O provider so inicializa quando:

1. a flag `app.observability.analytics` esta habilitada;
2. `EXPO_PUBLIC_POSTHOG_API_KEY` existe no build;
3. o usuario nao registrou opt-out em **Central de privacidade**.

### Secrets e host

Definir o token publico do projeto PostHog via EAS secret:

```bash
eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_POSTHOG_API_KEY \
  --value "phc_<project-token>" \
  --type string
```

Opcionalmente, usar `EXPO_PUBLIC_POSTHOG_HOST` quando o projeto estiver
em regioes especificas (`https://us.i.posthog.com` por padrao,
`https://eu.i.posthog.com` para EU).

### LGPD e minimizacao

- `disableGeoip: true` evita enriquecimento automatico por IP.
- Session replay fica desligado (`enableSessionReplay: false`).
- Eventos passam por `sanitizeTelemetryContext`, que redige email, token,
  segredo, DSN, IP e URLs com parametros sensiveis.
- O opt-out persiste em SecureStore
  (`auraxis.analytics-opt-out.v1`) e chama `posthog.optOut()`; reativar
  analytics chama `posthog.optIn()`.

### Eventos canonicos

Eventos instrumentados no app:

- `auth.login.success`, `auth.register.completed`, `auth.logout`.
- `transaction.created`, `transaction.deleted`, `transaction.restored`.
- `goal.created`, `goal.simulated`.
- `tool.used`.
- `subscription.checkout.opened`, `subscription.checkout.completed`.
- `dashboard.period.changed`.
- screen views via Expo Router (`posthog.screen(pathname, metadata)`).

## Checkout provider

`EXPO_PUBLIC_CHECKOUT_PROVIDER` controla o provider de compra usado pela
tela canonica de assinatura:

| Valor | Uso |
|---|---|
| `hosted` | Default. Usa o checkout hospedado retornado por `/subscriptions/checkout`; recomendado para dev, preview e canais internos. |
| `store` | Canal de App Store / Play Store. Nao abre checkout externo; enquanto StoreKit/Play Billing nao estiverem configurados, retorna erro seguro `STORE_CHECKOUT_UNCONFIGURED`. |

Esse valor e publico e nao deve conter segredo. A decisao de entitlement e
subscription continua no backend; o app apenas escolhe o provider de compra por
canal e invalida `subscription`/`entitlements` depois do retorno.

## Push notifications

Push nativo e controlado pela flag `app.notifications.push`. O opt-in vive em
`/preferencias-notificacao` e registra o dispositivo apenas quando o usuario
liga o toggle.

### Contrato backend

Registro:

```http
POST /notifications/subscribe
```

Payload Expo:

```json
{
  "transport": "expo",
  "endpoint": "ExponentPushToken[...]",
  "device_label": "iPhone 15"
}
```

Opt-out:

```http
POST /notifications/unsubscribe
```

```json
{
  "endpoint": "ExponentPushToken[...]"
}
```

### Config nativa

`app.json` registra o plugin `expo-notifications` com:

- `defaultChannel: "auraxis-default"` para FCM Android.
- `mode: "production"` para gerar entitlement APNS de producao.
- `color: "#2F80ED"` para a cor do icone de notificacao Android.

O canal Android tambem e criado em runtime por
`features/notifications/hooks/use-push-registration.ts`, porque o usuario pode
ativar push antes de receber a primeira mensagem FCM.
O app tambem cria o canal legado `analysis_ready` enquanto o backend antigo ainda
envia esse `channelId`; novos payloads devem usar `auraxis-default`.

### Payload de roteamento

O listener global (`core/notifications/listener.ts`) aceita `deeplink` ou
`deep_link` em `notification.request.content.data`. Apenas URLs aprovadas por
`parseAppUrl` sao abertas.
Como compatibilidade com payloads antigos, `screen: "Dashboard"` roteia para
`auraxisapp://dashboard`.

Exemplo:

```json
{
  "type": "weekly_insight",
  "deeplink": "auraxisapp://dashboard?focus=weekly-insight"
}
```

Eventos Sentry/breadcrumb:

- `push.delivered` quando a notificacao chega em foreground.
- `push.tapped` quando o usuario toca na notificacao.

## SSL pinning

Pinning é aplicado em duas camadas:

### 1. Nativo (primário)

**iOS** — `app.json` declara `expo.ios.infoPlist.NSAppTransportSecurity`:

```jsonc
"NSAppTransportSecurity": {
  "NSAllowsArbitraryLoads": false,
  "NSPinnedDomains": {
    "auraxis.com.br": {
      "NSIncludesSubdomains": true,
      "NSPinnedCAIdentities": []  // populado por ops antes de promover a prod
    }
  }
}
```

**Android** — `app.json` aponta `expo.android.networkSecurityConfig` para
`assets/network-security-config.xml`. Hoje o XML aplica baseline (cleartext
bloqueado, system trust apenas). O bloco `<domain-config>` com `<pin-set>`
entra quando ops popular as hashes SPKI.

### 2. Defensivo (JS, este módulo)

`core/security/ssl-pinning.ts::verifyCanonicalRequest(url)` valida que
toda chamada outbound:

- Usa `https://` (rejeita `http://`).
- Tem hostname dentro de `*.auraxis.com.br` (rejeita typos, dev-only
  bypass URLs, exfil para hosts arbitrários).

Retorna `{ kind: "ok" }` ou `{ kind: "blocked", reason: ... }`. O HTTP
client integra esse predicate antes de despachar a request — é
belt-and-braces sobre o pinning nativo.

### Geração e rotação dos pins SPKI

```bash
# 1. Baixar o cert público da raiz canônica
openssl s_client -connect api.auraxis.com.br:443 -servername api.auraxis.com.br \
  </dev/null 2>/dev/null | openssl x509 -outform PEM > /tmp/api-cert.pem

# 2. Extrair o SPKI hash (formato Apple/Android)
openssl x509 -in /tmp/api-cert.pem -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | openssl enc -base64

# Saída: hash base64 — usar como pin atual.
# Repetir com a CA de backup (próxima rotação) para o pin secundário.
```

**Política de pins:**

- Sempre dois pins: **atual** + **backup** (próximo). Nunca um só, ou um
  pin roll forçaria atualização da app store antes do cert vencer.
- Validade dos pins documentada no XML/Info.plist com expiração explícita
  no XML Android (`<pin-set expiration="YYYY-MM-DD">`).
- Rotação a cada 90 dias (alinhado ao ACM auto-renew).

### Smoke tests pós-build (manuais)

```bash
# 1. Build de preview com pinning
EXPO_PUBLIC_SSL_PINNING_ENABLED=true \
EXPO_PUBLIC_SSL_PINNING_FINGERPRINTS="sha256/<hash1>,sha256/<hash2>" \
eas build --profile preview

# 2. Cert válido → request OK (esperado)
# 3. Proxiar via mitmproxy/Charles com cert custom → request bloqueado (TLS handshake fail)
```

### Posture do flag `EXPO_PUBLIC_SSL_PINNING_ENABLED`

Esse flag NÃO controla o pinning nativo (que é imutável uma vez que a
app é instalada). Ele controla a **postura defensiva JS**: telemetria,
breadcrumbs Sentry, e dashboards de ops que verificam se a build foi
promovida com intenção de pinning. Native pinning é always-on quando
o `app.json` declara as estruturas.

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
