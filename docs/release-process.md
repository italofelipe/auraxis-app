# Release process — ciclo alfa (Google Play internal + TestFlight)

Runbook canônico do ciclo de publicação do app durante o alfa.
Épico de referência: [#518](https://github.com/italofelipe/auraxis-app/issues/518).

## Visão geral do ciclo

```
mudança JS-only  ──────────────► OTA via EAS Update (workflow ota-update.yml)
                                  └─ não gasta build credits, chega em minutos

mudança nativa / bump version ─► build + submit (workflow store-release.yml)
                                  ├─ Android → Play internal testing (draft)
                                  └─ iOS → TestFlight
```

Gatilhos do `store-release.yml`:

- **Tag `v*`** (criada pelo release-please ao mergear o PR de release):
  build `production` nas duas plataformas com `--auto-submit`.
- **Manual (`workflow_dispatch`)**: escolhe plataforma, profile e auto-submit.

Gatilho do `ota-update.yml`: somente manual (`workflow_dispatch`), escolhendo
canal `preview` ou `production` — publica o estado JS do commit checked-out.

## OTA vs build novo — regra de decisão

Use **OTA** (EAS Update) apenas para mudanças de JavaScript/TypeScript, assets,
copy, i18n e feature flags.

Exige **build nativo novo** qualquer mudança em: dependência com código nativo,
plugin Expo, permissão, `app.json` (bundle id, plist, manifest, ícones, splash),
`eas.json`, ou bump de `version`.

> **Atenção — `runtimeVersion.policy: appVersion`**: um OTA publicado só
> alcança builds instalados com a **mesma `version`** do `app.json`. Depois de
> um release que bumpou a version, builds antigos não recebem mais OTA — eles
> precisam atualizar pela loja.

## Variáveis de ambiente (EAS)

As envs de runtime ficam no **EAS environment** (`eas env:list --environment
production|preview`), não em secrets do GitHub. Matriz mínima de produção
(issue [#522](https://github.com/italofelipe/auraxis-app/issues/522)):

| Var | Valor (produção) |
|-----|------------------|
| `EXPO_PUBLIC_API_URL` | `https://api.auraxis.com.br` |
| `EXPO_PUBLIC_APP_ENV` | `production` |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN do projeto Sentry `auraxis-app` |
| `EXPO_PUBLIC_POSTHOG_API_KEY` / `EXPO_PUBLIC_POSTHOG_HOST` | key/host do PostHog |
| `SENTRY_AUTH_TOKEN` | secret — upload de source maps no build |
| `APPLE_TEAM_ID`, `ASC_*` (5 vars) | submit iOS (já configuradas) |
| `GOOGLE_SERVICE_ACCOUNT` | secret file — submit Android (setup no guia do Play) |

GitHub Actions precisa apenas de `EXPO_TOKEN`.

## Fluxos

### Release completo (build + lojas)

1. Mergear o PR do release-please (cria a tag `v*`) — ou disparar
   `store-release.yml` manualmente.
2. Acompanhar o build no [dashboard do EAS](https://expo.dev/accounts/italofelipe/projects/auraxis-app/builds).
3. Android: o submit entra como **draft** no internal track — promover no Play
   Console. iOS: o build aparece no TestFlight após o processamento.

### OTA (JS-only)

1. Garantir que a mudança está mergeada em `main`.
2. Actions → "OTA Update (EAS Update)" → Run workflow → canal `production`
   (ou `preview` para validar antes em build interno).
3. Verificar com `eas update:list --channel <canal> --limit 3`.
4. Apps instalados aplicam o update no segundo relaunch.

### Rollback de OTA

```bash
eas update:list --channel production --limit 10
```

Republicar o estado JS anterior (checkout do commit bom + `eas update`) ou usar
o rollback do dashboard EAS no branch/canal afetado. Registrar o update ID no
incident note e confirmar que um dispositivo instalado recebe o rollback.

## Smoke checklist (alfa)

- Cadastro de conta nova + login + logout.
- Dashboard carrega contra `api.auraxis.com.br` (nunca localhost — guard #521).
- Transação: criar/excluir/restaurar; troca de período mensal.
- Meta: criar e simular.
- Assinatura abre hosted checkout; store checkout falha com segurança até
  StoreKit/Play Billing serem configurados.
- Privacy center: opt-out de analytics interrompe eventos PostHog.
- Push opt-in trata permissão negada/indisponível.
- Deep links: link privado roteia após login; link inválido cai no fallback.
- Sentry recebe erro de teste sem PII.
- PostHog recebe eventos de tela/produto sem email/CPF/token/valores brutos.
- OTA de teste aplicado em dispositivo com o build instalado.

## Maestro

Smoke local:

```bash
maestro test .maestro/01_login.yaml
maestro test .maestro/02_dashboard_overview.yaml
maestro test .maestro/06_privacy_analytics_opt_out.yaml
maestro test .maestro/07_tool_usage.yaml
maestro test .maestro/08_subscription_checkout_smoke.yaml
maestro test .maestro/09_notification_preferences_smoke.yaml
maestro test .maestro/05_logout.yaml
```

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Build iOS falha com "Distribution Certificate is not validated for non-interactive builds" | Cert nunca validado interativamente | Italo roda `npx eas-cli credentials` (iOS) uma vez |
| Build falha com warning de channel sem expo-updates | Pacote `expo-updates` ausente | Issue #519 |
| Submit Android falha por credencial | `GOOGLE_SERVICE_ACCOUNT` ausente/sem permissão | Guia `docs/runbooks/googleplay-setup-italo.md` |
| OTA não chega no dispositivo | `version` do build ≠ version do update (`runtimeVersion: appVersion`) | Publicar build novo pela loja |
| App de produção aponta para localhost | EAS env `EXPO_PUBLIC_API_URL` ausente | Issue #522 / guard #521 |
