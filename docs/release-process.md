# Release process — PR, OTA, Google Play e TestFlight

Runbook canônico da entrega móvel. A política de changelog desta página é
obrigatória: nenhum preview, OTA, build ou release de loja pode ser criado sem
descrever detalhadamente, em pt-BR, o que mudou para os usuários.

## Fluxo automático

```text
PR aberto/atualizado
  └─ CI verde
      └─ delivery-after-ci.yml
          ├─ runtime nativo compatível → EAS Update no branch pr-<número>
          └─ runtime nativo diferente → build preview Android + iOS

merge na main
  └─ CI verde
      ├─ runtime nativo compatível → OTA no canal production
      └─ runtime nativo diferente → aguarda a tag do Release Please

tag vX.Y.Z
  └─ store-release.yml, uma execução por vez
      ├─ job prepare
      │   ├─ gera changelog a partir dos PRs da versão
      │   ├─ valida versão + credenciais + duplicidade
      │   └─ publica o changelog validado como artifact da execução
      ├─ job android-delivery (independente)
      │   ├─ build → submit (aguarda a submission)
      │   └─ Google Play draft recebe release notes e só então vira completed
      └─ job ios-delivery (independente)
          ├─ build → eas metadata:push (release notes) → submit (aguarda)
          └─ TestFlight recebe What to Test pela API do App Store Connect
```

O PR mecânico `chore(main): release X.Y.Z` não cria outro preview ou build. A
tag gerada pelo Release Please é a proprietária única do build de loja. Essa
exceção evita os dois builds concorrentes observados em 24/07/2026.

## Changelog obrigatório

Todo PR não gerado pelo Release Please deve conter:

```md
## Changelog de loja

- Mudança percebida pelos usuários, escrita de forma clara e específica.
- Impacto, correção ou melhoria entregue para quem usa o aplicativo.
```

Regras verificadas pelo CI:

- idioma `pt-BR`;
- no mínimo 2 bullets e 100 caracteres;
- no máximo 500 caracteres, limite adotado para o Google Play;
- cada bullet deve ter pelo menos 25 caracteres;
- `N/A`, `TODO`, “não se aplica”, “sem alterações” e placeholders são
  rejeitados.

O release de tag lê os PRs referenciados na seção atual do `CHANGELOG.md`,
agrega os textos e falha antes do build caso uma nota esteja ausente ou o total
ultrapasse o limite. Não existe fallback para título de commit: se não há
changelog detalhado, não há deploy.

OTAs e releases manuais também exigem o texto completo no formulário do
workflow. As notas são usadas como mensagem do EAS Update/build e registradas no
resumo da execução.

## Decisão OTA versus build

O `runtimeVersion` usa `policy: fingerprint`. Para Android e iOS, o workflow
calcula o fingerprint nativo atual e compara com os builds do mesmo perfil:

- ambos possuem build finalizado e compatível: publica OTA;
- algum fingerprint não possui build: cria build nativo;
- existe build compatível em andamento: aguarda, sem criar duplicata.

Mudanças apenas em JavaScript, TypeScript, assets, copy, i18n e feature flags
normalmente conservam o fingerprint. Dependências nativas, plugins Expo,
permissões, configuração nativa, ícones e splash normalmente alteram o
fingerprint.

A comparação é conservadora: ausência de informação produz build, nunca OTA
potencialmente incompatível.

Antes de qualquer build nativo, execute `npm run ssl-pinning:check`. O gate
confirma que os pins CA-SPKI de iOS e Android estão alinhados, que a política
Android não está perto de expirar e que todos os pins correspondem à cadeia TLS
servida em produção. Mudanças de pinning sempre exigem binário novo; uma OTA não
altera a política nativa já instalada.

## Versões e deduplicação

`package.json`, `app.json` (`expo.version`) e
`.release-please-manifest.json` devem ter exatamente a mesma versão. O Release
Please atualiza os três; o workflow de loja repete a validação antes de consumir
créditos.

O `versionCode` Android e o `buildNumber` iOS continuam remotos e
auto-incrementais no EAS. Para deduplicar uma release, o workflow exige ao mesmo
tempo:

- mesma versão pública;
- mesmo fingerprint nativo;
- mesmo perfil e plataforma;
- build finalizado ou em andamento.

Todas as execuções de loja compartilham a mesma fila de concorrência. Um
dispatch manual e uma tag não podem mais iniciar builds em paralelo.

## Isolamento por plataforma

Android e iOS são jobs irmãos: os dois dependem só do `prepare` e nunca um do
outro. Consequências práticas:

- a falha de uma loja não cancela nem invalida a entrega da outra;
- cada plataforma faz `eas build` e `eas submit` em passos separados. O
  `--auto-submit` foi removido: ele acopla as duas plataformas no mesmo comando
  e esconde o resultado da submission;
- nenhuma submissão usa `--no-wait`. A finalização (notas do Play, What to Test)
  só começa depois que a submission daquela plataforma terminou;
- o changelog validado é gerado uma única vez no `prepare` e distribuído como
  artifact. Nenhum job revalida ou regenera o texto, então as duas lojas
  recebem exatamente os mesmos bytes.

O gate `scripts/check-store-release-workflow.cjs` (dentro de
`npm run policy:check`) congela esse formato: ele falha se os jobs voltarem a
ser um só, se um depender do outro, se um flag proibido reaparecer ou se a
ordem submit → finalização for invertida.

### Recuperação de falha parcial

Uma execução com Android verde e iOS vermelho (ou o inverso) **não deve ser
re-executada inteira**. Use `Re-run failed jobs`: o `prepare` já concluiu e o
job da plataforma que passou não é refeito. Se o build da plataforma que falhou
já existir no EAS, o `prepare` o classifica como `ready` e a nova execução só
submete, sem consumir outro build.

Recuperação manual, na ordem em que o pipeline faria:

```bash
eas build:list --platform ios --profile production --status finished --limit 5 --json --non-interactive
eas metadata:push --profile production --non-interactive          # notas pt-BR antes do submit
eas submit --platform ios --id <BUILD_ID> --profile production --non-interactive
node scripts/app-store-connect-release-notes.cjs \
  --app-id 6772551270 --build-number <BUILD_NUMBER> \
  --metadata-file build/store-release/metadata.json
```

```bash
eas submit --platform android --id <BUILD_ID> --profile production --non-interactive
node scripts/google-play-release.cjs \
  --metadata-file build/store-release/metadata.json \
  --package com.sensoriumit.auraxis --track internal --version-code <VERSION_CODE>
```

O `metadata.json` está no artifact `store-release-changelog` da execução.

## Limitações do plano EAS

O plano atual não é Enterprise. Isso proíbe, de forma permanente:

- passar o texto de "what to test" ao `eas submit` — o parâmetro existe apenas
  no Enterprise e aborta o comando nos demais planos. O What to Test é gravado
  pela API oficial do App Store Connect (`betaBuildLocalizations`);
- depender de qualquer automação que exija esse parâmetro para concluir.

O que continua disponível e é usado: `eas build`, `eas submit`, `eas update`,
`eas metadata:lint` e `eas metadata:push`.

## Deploy Minimum

`deploy-minimum.yml` tem dois jobs com exigências diferentes:

- `web-baseline-artifact` roda em todo push de `main` e apenas exporta o bundle
  web. Ele **não** exige changelog de loja: pushes não carregam o input
  `release_notes` e o gate derrubava o job antes de exportar qualquer coisa;
- `eas-preview-build` só roda por `workflow_dispatch` com
  `run_eas_build = true`. Esse job exige e valida o changelog detalhado no
  próprio runner, porque `build/store-release/` é local ao job e não sobrevive
  entre jobs.

## Google Play internal

O EAS Submit envia somente o AAB. Ele não administra release notes. Por isso o
perfil Android permanece com `releaseStatus: draft`, que não serve o APK/AAB
aos testadores.

Depois que o submit termina:

1. o workflow localiza o build Android pelo `GITHUB_SHA`, versão e
   `versionCode`;
2. abre um edit na Google Play Developer API;
3. localiza exatamente esse `versionCode` no track `internal`;
4. grava nome da release e `releaseNotes` em `pt-BR`;
5. muda somente essa release de `draft` para `completed`;
6. commita o edit;
7. abre um edit somente-leitura, relê o track e confirma que o Google Play
   reporta `completed`, com o nome `versão (versionCode)` e as notas pt-BR
   exatas. Só então o passo é considerado bem-sucedido.

Qualquer falha mantém o draft não distribuído. A promoção
`internal → production` continua manual no Play Console.

O segredo GitHub `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` contém a mesma service
account usada pelo EAS e precisa das permissões “Release apps to testing tracks”
e “View app information”.

## TestFlight e App Store

O EAS Metadata sincroniza as notas públicas `releaseNotes` em `pt-BR` para a
versão exata da App Store usando `store.config.js`, antes do build.

Depois do submit, `scripts/app-store-connect-release-notes.cjs` aguarda o build
aparecer no App Store Connect e grava o mesmo changelog em **What to Test** pela
API oficial. O workflow não usa `eas --what-to-test`, indisponível no plano
atual. Ausência de credencial Apple bloqueia o build antes do upload.

O upload para TestFlight não publica o app na App Store. Selecionar o build,
submeter para App Review e liberar a versão pública continuam sendo gates
manuais no App Store Connect.

## Promoção pública manual

- Android: Play Console → Testing → Internal testing → release validada →
  Promote release → Production → revisar rollout → Rollout to Production.
- iOS: App Store Connect → versão com notas → selecionar build do TestFlight →
  Submit for Review → liberar manualmente ou em phased release.

Antes da promoção, conferir versão, build number/versionCode, changelog,
screenshots/listing e smoke checklist.

## Secrets e configuração

GitHub Actions:

| Secret | Uso |
|---|---|
| `EXPO_TOKEN` | EAS Build, Submit, Update e Metadata |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | anexar notas e concluir o track interno |
| `APP_STORE_CONNECT_ISSUER_ID` | emitir JWT para localizar o build submetido |
| `APP_STORE_CONNECT_KEY_ID` | identificar a chave da API App Store Connect |
| `APP_STORE_CONNECT_PRIVATE_KEY_BASE64` | assinar o JWT e publicar What to Test |
| `RELEASE_PLEASE_TOKEN` | criar/mergear release PR e tag |

As variáveis do app ficam nos ambientes EAS `preview` e `production`, incluindo
`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ENV`, Sentry e PostHog. Nunca colocar
essas variáveis públicas ou credenciais de loja diretamente no YAML.

## Arquivo enviado ao EAS

`.easignore` deve permanecer um superset estrito de `.gitignore` e excluir
`node_modules/`, `android/`, `ios/`, segredos e artefatos locais. O gate
`check-runtime-release-governance` bloqueia regressões. Essa regra evita que
conteúdo local altere o fingerprint ou interrompa um build que não reproduz o
checkout do GitHub.

## E2E nativo e evidência visual

Todo PR executa `.github/workflows/mobile-critical-e2e.yml`. Android e iOS são
construídos **no próprio runner do GitHub** (estratégia híbrida, issue #734):
`expo prebuild` + Gradle `assembleRelease` no Ubuntu e `expo prebuild` +
`xcodebuild -sdk iphonesimulator` (sem assinatura) no macOS. O Maestro roda nos
emuladores nativos do GitHub e salva seis capturas em `MAESTRO_TESTS_DIR`.
Builds E2E não consomem a cota EAS — ela fica reservada para releases de loja
— e a governança (`check-runtime-release-governance`) bloqueia a reintrodução
de `eas build` nesse workflow. O perfil `e2e-test` permanece em `eas.json`
como rota de escape para builds manuais via EAS.

Pré-condições:

- secrets GitHub `E2E_EMAIL` e `E2E_PASSWORD`;
- GitHub variables `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ENV`,
  `EXPO_PUBLIC_POSTHOG_API_KEY` e `EXPO_PUBLIC_POSTHOG_HOST` (espelho do
  ambiente EAS `preview` para o bundle JS — nunca hardcoded no YAML);
- conta E2E com ao menos uma pendência financeira e transações no mês atual.

O workflow valida as credenciais antes de compilar. Se elas estiverem
ausentes, o job falha com a credencial exata e não tenta publicar um artifact
vazio, preservando um diagnóstico único e acionável.

As capturas ficam nos artifacts `mobile-e2e-ios-<sha>` e
`mobile-e2e-android-<sha>` e, para PRs visuais,
devem ser copiadas para `docs/wiki/assets/<issue>/` e incorporadas à descrição
do PR com plataforma, versão, build e SHA.

## Operação manual

### OTA

Actions → `OTA Update (EAS Update)` → escolher canal → informar changelog
detalhado → executar. O mesmo limite de 100–500 caracteres é aplicado.

### OTA sem depender da Expo (servidor próprio)

Actions → `OTA Update (servidor próprio)` → escolher canal → executar. Publica
no nosso servidor de updates (épico platform#978) sem passar por serviço da
Expo: `expo export` roda local, os assets vão para o nosso bucket e o registro
é um POST no api-v2.

Existe porque em 01/08/2026 o `eas update` travou duas vezes seguidas no
upload, 6h de runner cada, sem publicar nada (#763).

> ⚠️ **Só atende binários publicados com `updates.url` apontando para o nosso
> servidor.** A URL é gravada em tempo de build, então o parque instalado hoje
> continua ouvindo `u.expo.dev` — os dois caminhos convivem até a versão nova
> ter adoção.

Runbook completo, incluindo rollback e rotação da chave de assinatura:
`auraxis-platform/docs/wiki/OTA-Servidor-Proprio.md`.

### Build de loja

Actions → `Store Release (Manual + Tag)` → escolher plataforma/profile →
informar changelog detalhado → executar. `auto_submit=true` só é aceito no
profile `production`.

### Rollback de OTA

Identificar o update bom em `eas update:list --channel production`, republicar o
estado anterior ou usar o rollback do dashboard EAS. Registrar o update ID e
confirmar em dispositivo real após dois relaunches.

## Smoke checklist

- Cadastro, login e logout.
- `npm run ssl-pinning:check` encontra todos os pins na cadeia TLS ao vivo.
- Login inválido mostra erro de credenciais; falha de transporte mostra erro de
  rede; senha permanece mascarada.
- Dashboard usa `https://api.auraxis.com.br`, nunca localhost.
- Criar, editar, excluir e restaurar transação.
- Criar e simular meta.
- Abrir/cancelar assinatura conforme o provedor.
- Privacy center, push opt-in e deep links.
- Sentry e PostHog sem PII.
- Android: tester interno enxerga versão e changelog corretos.
- iOS: TestFlight mostra What to Test e versão correta.
- E2E: Insights e Cartões abrem em ambos os binários sem encerramento.
- OTA compatível é aplicado no segundo relaunch.

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| Play mostra `com.sensoriumit.auraxis (unreviewed)` | listing interno inicial ainda não propagou | aguardar até 48h e completar o store listing; isso é separado do AAB |
| Release Android continua draft | etapa de notas/API falhou ou secret sem permissão | corrigir a falha e repetir o workflow; não promover manualmente sem notas |
| Versão do AAB difere da tag | drift entre package/app/manifest | corrigir os três; o preflight deve bloquear |
| OTA não chega | fingerprint do update não possui build compatível | criar build nativo para esse fingerprint |
| Segundo build idêntico apareceu | execução anterior ao guard de #719 ou mudança de versão/fingerprint | comparar versão, fingerprint e SHA no EAS |
| Metadata iOS falha | versão ainda não disponível ou credencial Apple inválida | validar no App Store Connect e repetir; binário não vira produção sozinho |

O diagnóstico do incidente original está em
`docs/wiki/google-play-empty-release-notes-2026-07-24.md`.
