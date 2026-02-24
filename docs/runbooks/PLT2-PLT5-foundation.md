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

## Pendências para concluir PLT4

- Definir provider OSS (Unleash/OpenFeature) e integrar o cliente de flags no bootstrap do app.
- Estabelecer política de governança de flags (owner, expiração e remoção).
