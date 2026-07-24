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
      ├─ gera changelog a partir dos PRs da versão
      ├─ valida versão + credenciais + duplicidade
      ├─ build e submit Android/iOS
      ├─ App Store/TestFlight recebe What to Test + release notes
      └─ Google Play draft recebe release notes e só então vira completed
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
6. commita o edit.

Qualquer falha mantém o draft não distribuído. A promoção
`internal → production` continua manual no Play Console.

O segredo GitHub `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` contém a mesma service
account usada pelo EAS e precisa das permissões “Release apps to testing tracks”
e “View app information”.

## TestFlight e App Store

O build iOS recebe o mesmo changelog no campo **What to Test** do TestFlight.
Depois do submit, o EAS Metadata sincroniza `releaseNotes` em `pt-BR` para a
versão exata da App Store usando `store.config.js`.

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
| `RELEASE_PLEASE_TOKEN` | criar/mergear release PR e tag |

As variáveis do app ficam nos ambientes EAS `preview` e `production`, incluindo
`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ENV`, Sentry e PostHog. Nunca colocar
essas variáveis públicas ou credenciais de loja diretamente no YAML.

## Operação manual

### OTA

Actions → `OTA Update (EAS Update)` → escolher canal → informar changelog
detalhado → executar. O mesmo limite de 100–500 caracteres é aplicado.

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
- Dashboard usa `https://api.auraxis.com.br`, nunca localhost.
- Criar, editar, excluir e restaurar transação.
- Criar e simular meta.
- Abrir/cancelar assinatura conforme o provedor.
- Privacy center, push opt-in e deep links.
- Sentry e PostHog sem PII.
- Android: tester interno enxerga versão e changelog corretos.
- iOS: TestFlight mostra What to Test e versão correta.
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
