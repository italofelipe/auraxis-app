# Entrega de loja resiliente sem EAS Enterprise (2026-08-02)

## Relato

A release `1.13.7`, disparada pela tag `v1.13.7`, produziu as builds Android e
iOS corretamente, mas o workflow não concluiu o fluxo sem intervenção manual.

Run de referência:
[30098991202](https://github.com/italofelipe/auraxis-app/actions/runs/30098991202).
Issue de correção:
[#722](https://github.com/italofelipe/auraxis-app/issues/722).

## Causa raiz

1. **Parâmetro exclusivo do plano Enterprise.** O envio iOS recebeu o texto de
   "what to test" pelo `eas submit`. Esse parâmetro só existe no plano
   Enterprise e aborta o comando nos demais planos.
2. **Plataformas acopladas.** Android e iOS viviam no mesmo job, em passos
   sequenciais. A falha do agendamento iOS interrompeu o job inteiro e impediu a
   finalização do Android — que já tinha um AAB pronto e aceito.
3. **`Deploy Minimum` exigia changelog em push.** O job de export web validava
   `## Changelog de loja` mesmo em `push` para `main`, evento que não carrega o
   input `release_notes`. Todo push falhava antes de exportar qualquer coisa.
4. **`build/store-release/` compartilhado entre jobs.** O job de preview lia um
   `metadata.json` gerado em outro job, que nunca existiu no runner dele.

## Correção

### Isolamento por plataforma

`store-release.yml` passou a ter quatro jobs:

| Job | Papel |
|---|---|
| `prepare` | changelog validado, versão, credenciais, dedup por fingerprint; publica o artifact `store-release-changelog` |
| `android-delivery` | build → submit (aguarda) → notas pt-BR + `completed` no track interno |
| `ios-delivery` | build → `eas metadata:push` → submit (aguarda) → What to Test |
| `release-summary` | roda com `always()` e registra o resultado de cada loja |

`android-delivery` e `ios-delivery` dependem **apenas** de `prepare`, nunca um
do outro. Uma loja pode concluir enquanto a outra falha.

### Comandos sem dependência de Enterprise

- `--auto-submit` foi removido: build e submit são passos separados, o que
  permite isolar plataformas e ler o resultado da submission;
- nenhuma submissão usa `--no-wait`: a finalização só começa quando a
  submission daquela plataforma termina;
- o texto de "what to test" nunca vai para o `eas submit`. As notas públicas
  vão por `eas metadata:push` **antes** do submit e o What to Test é gravado
  pela API oficial do App Store Connect depois do upload.

### Evidência no Google Play

Depois de commitar o edit, `scripts/google-play-release.cjs` abre um edit
somente-leitura e relê o track: exige `status: completed`, nome
`versão (versionCode)` e as notas pt-BR idênticas às validadas. "A API aceitou
o edit" deixou de contar como entrega concluída.

### Deploy Minimum

O export web não exige mais changelog de loja — ele não publica nada. A
validação passou para o job que dispara o build EAS, no mesmo runner que
consome o `metadata.json`.

## Recuperação de falha parcial

1. Use **Re-run failed jobs**, não re-run completo: `prepare` e a plataforma
   verde não são refeitos.
2. Se o build da plataforma que falhou já existir no EAS, o `prepare` o
   classifica como `ready` e a nova execução só submete — sem consumir outro
   build.
3. Para recuperação manual, baixe o artifact `store-release-changelog` e siga a
   sequência documentada em [`docs/release-process.md`](../release-process.md)
   (seção "Recuperação de falha parcial").

## Gate permanente

`scripts/check-store-release-workflow.cjs`, dentro de `npm run policy:check`,
falha o CI se:

- `store-release.yml` voltar a colapsar as plataformas em um job;
- um job de plataforma passar a depender do outro;
- reaparecer um flag proibido (`--what-to-test`, `--auto-submit`, `--no-wait`);
- a ordem submit → finalização for invertida, ou as notas da App Store deixarem
  de preceder o submit;
- `deploy-minimum.yml` voltar a exigir changelog em um job que roda em push.

Comentários que citam um flag proibido não contam como uso — o gate ignora
linhas de comentário de propósito, para que a regra possa ser documentada onde
ela vale.
