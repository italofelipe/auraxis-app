# Incidente — Google Play sem versão e sem release notes (2026-07-24)

## Relato

No Samsung S26 Ultra, a página de teste do Google Play exibia
`com.sensoriumit.auraxis (unreviewed)`, ícone genérico e nenhuma informação de
versão ou mudanças. iOS/TestFlight aparentava receber builds automaticamente,
enquanto Android não entregava uma atualização utilizável.

Issue de correção:
[#719](https://github.com/italofelipe/auraxis-app/issues/719).

## Evidências

- O run de release `v1.13.5` terminou como verde no GitHub e o EAS confirmou o
  submit, mas a configuração usada era `track=internal` +
  `releaseStatus=draft`.
- O EAS construiu tags `v1.13.5` e `v1.13.6` com **App Version 1.13.4**. Na
  mesma revisão, `package.json` e o manifesto já estavam em 1.13.6.
- Um dispatch manual e a tag `v1.13.6` iniciaram dois builds Android para o
  mesmo fingerprint nativo.
- Consulta autenticada ao track `internal` em 24/07/2026 encontrou o
  `versionCode 25` em `draft`, sem `releaseNotes`.
- O EAS Submit envia o binário, mas não administra release notes ou o store
  listing.

O nome temporário do package e o ícone genérico não provam falha de upload. O
Google pode mostrar informações temporárias na primeira publicação interna por
até 48 horas. O draft sem notas, a divergência de versão e a execução duplicada
eram falhas independentes e reais do pipeline.

## Causa raiz

1. O workflow tratava “AAB enviado” como conclusão do release.
2. `releaseStatus: draft` era intencional para segurança, mas não existia uma
   segunda etapa para anexar notas e concluir o track interno.
3. Não havia fonte obrigatória de changelog detalhado por PR.
4. O Release Please atualizava `package.json`, mas não `app.json`.
5. Dispatch manual e tag tinham grupos de concorrência diferentes/inexistentes.
6. A decisão OTA versus build era manual e não comparava fingerprints.

## Correção

- CI bloqueia PR sem `## Changelog de loja` válido.
- Entrega pós-CI escolhe OTA ou preview nativo por fingerprint.
- Release Please sincroniza `app.json`.
- Store release é serializado e deduplicado por versão/fingerprint.
- Google continua recebendo um draft; a Developer API anexa notas em pt-BR e
  muda exatamente o `versionCode` enviado para `completed`.
- TestFlight recebe What to Test; EAS Metadata sincroniza release notes da App
  Store.
- Releases públicas continuam com aprovação humana.

## Política permanente

Nenhum preview, OTA, build ou release de loja pode ser iniciado sem changelog
detalhado. Falta, placeholder ou texto acima do limite bloqueiam a execução
antes do build. Em caso de falha posterior, o Android fica draft e não é servido
aos testadores.

## Verificação

Para cada tag:

1. versão em `package.json`, `app.json` e manifesto é idêntica;
2. somente um build por plataforma e fingerprint;
3. Play internal mostra release `X.Y.Z (versionCode)`, status completed e notas
   pt-BR;
4. TestFlight mostra What to Test;
5. App Store Connect contém What’s New em pt-BR;
6. promoção pública permanece pendente até aprovação humana.

## Riscos residuais

- O listing, nome, ícone, classificação e screenshots continuam dependendo do
  preenchimento/propagação no Play Console.
- A conta de serviço precisa manter permissões no app.
- EAS Metadata é beta; uma falha impede o workflow de ficar verde, mas não
  publica o binário iOS automaticamente na App Store.
- Releases antigas sem a nova seção de changelog não podem ser republicadas
  automaticamente sem notas manuais validadas.
