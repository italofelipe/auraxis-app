# PLT2-PLT5 - Foundation (App)

## Objetivo

Preparar o app para:

- distribuição mínima contínua para inspeção;
- publicação em stores (fluxo manual controlado);
- versionamento automático sem bump manual;
- base para feature toggles OSS.

## Entregas deste bloco

1. Versionamento automático:
   - `.github/workflows/release-please.yml`
   - `.release-please-config.json`
   - `.release-please-manifest.json`
2. Foundation de release mobile:
   - `eas.json` com perfis `development`, `preview`, `production` e submit `production`
3. Deploy mínimo:
   - `.github/workflows/deploy-minimum.yml` (artifact web + preview build opcional)
4. Store release manual:
   - `.github/workflows/store-release.yml`

## Como operar

### Release automático

- Merge em `main/master` dispara `Release Please`.
- PR de release é aberto/atualizado automaticamente.
- Merge do PR publica tag/release.

### Deploy mínimo do app

- Workflow `Deploy Minimum (App Baseline)`:
  - sempre gera artifact web (`expo export --platform web`);
  - opcionalmente dispara build preview no EAS (`run_eas_build=true`).

### Publicação em stores

- Workflow `Store Release (Manual)`:
  - exige disparo manual (`workflow_dispatch`);
  - aceita plataforma (`android`/`ios`/`all`), perfil (`preview`/`production`) e `auto_submit`.

## Pendências para concluir PLT2

- Configurar identificadores finais de app (`android.package`, `ios.bundleIdentifier`).
- Provisionar credenciais de assinatura e app records no Google Play / App Store Connect.
- Popular variáveis e segredos obrigatórios de submit (`EXPO_TOKEN`, `ASC_APP_ID`, etc.).

## PLT4.2 (runtime OSS) — entregue

- Runtime de flags com provider `unleash` + fallback local:
  - `shared/feature-flags/service.ts`
- Integração real no catálogo de ferramentas:
  - `lib/tools-api.ts`
  - `hooks/queries/use-tools-query.ts`
- Cache curto para snapshot remoto com fallback resiliente.

Variáveis de ambiente suportadas (App):

- `EXPO_PUBLIC_FLAG_PROVIDER` (`local` | `unleash`, default `local`)
- `EXPO_PUBLIC_UNLEASH_PROXY_URL` (endpoint base do provider)
- `EXPO_PUBLIC_UNLEASH_CLIENT_KEY` (token de cliente, opcional)
- `EXPO_PUBLIC_UNLEASH_APP_NAME` (default `auraxis-app`)
- `EXPO_PUBLIC_UNLEASH_INSTANCE_ID` (default `auraxis-app`)
- `EXPO_PUBLIC_UNLEASH_ENVIRONMENT` (default `development`)
- `EXPO_PUBLIC_UNLEASH_CACHE_TTL_MS` (default `30000`)

## PLT4.1 (higiene de flags) — entregue

- Catálogo versionado de flags:
  - `config/feature-flags.json`
- Validador de metadados:
  - `scripts/check-feature-flags.cjs`
- Gate no CI:
  - job `Feature Flags Hygiene` em `.github/workflows/ci.yml`
- Paridade local:
  - etapa `flags:hygiene` em `scripts/run_ci_like_actions_local.sh`
