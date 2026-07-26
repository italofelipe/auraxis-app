# Mobile — estabilidade, entrega e linguagem visual (2026-07-25)

**Issues:** [#726](https://github.com/italofelipe/auraxis-app/issues/726) e
[#730](https://github.com/italofelipe/auraxis-app/issues/730)

## Contexto e achados

O app apresentava três classes de problema relacionadas:

1. Insights e Cartões encerravam o processo em iOS e Android, mas os testes
   mockavam integralmente essas telas e não validavam a árvore real.
2. O build iOS 1.13.9 nunca chegou ao TestFlight: o conteúdo local enviado ao
   EAS divergia do checkout, alterando o fingerprint e tornando o 1.13.8
   instalado uma evidência inválida para o hotfix.
3. A UI acumulava cards brancos com sombras fortes, raios excessivos, controles
   de tema espalhados e ações destrutivas proeminentes.

Também foram confirmados defeitos funcionais:

- Pendências enviava data sem timestamp completo e avançava o deck antes da
  confirmação da API;
- Calendário mantinha um mês local além do mês da tela, duplicando o cabeçalho;
- “paid” vazava para pt-BR;
- o resumo semanal mostrava `-100%` sem base comparável;
- TestFlight dependia de um parâmetro EAS indisponível no plano atual.

## Decisões permanentes

### Superfícies

- `AppSurfaceCard flat`: raio 14, hairline, sem sombra.
- `raised`: y 1, opacidade 0,08, blur 4 e elevation 1.
- `overlay`: raio superior 24 e profundidade curta.
- pills/chips continuam pill.
- sombras diretas fora dos tokens/componentes autorizados falham na governança.

### Tema

Configurações → Aparência é o único ponto de troca de tema. Os atalhos em
Transações, Insights, Cartões e no tour de Cartões foram removidos.

### Transações e calendário

- um único estado controla mês/ano;
- chevrons substituem caracteres `<`/`>`;
- Importar é a ação primária; Filtrar e Exportar são secundárias;
- Lixeira fica no menu de opções;
- o sheet diário usa separadores leves e rótulos `Recebido`/`Pago`.

### Pendências

- fechamento por X com alvo de 44×44;
- ações com ícones, processamento e bloqueio de duplo toque;
- `paid_at` em ISO 8601 completo;
- falha mantém o item aberto e oferece retry;
- rótulos variam entre “paga” e “recebida”.

### Release e diagnóstico

- `.easignore` reproduz o checkout e exclui dependências/native build/segredos;
- App Store recebe metadata pública e TestFlight recebe What to Test pela API;
- Google Play continua concluindo o draft apenas depois das notas;
- Configurações exibe versão, build, runtime, update e SHA;
- iOS e Android E2E são construídos do mesmo SHA e guardam screenshots.

## Aceite

O fluxo `.maestro/10_mobile_stability_visual.yaml` deve produzir, em cada
plataforma:

1. Pendências;
2. Transações analítica;
3. Calendário;
4. Movimentações do dia;
5. Insights;
6. Cartões.

Os arquivos aprovados ficam em
[`docs/wiki/assets/730/`](./assets/730/README.md), com versão/build/SHA no
manifesto e na descrição do PR.

## Proteções automatizadas

- testes reais de composição de Insights/Cartões;
- boundary e breadcrumbs por aba crítica;
- testes de sucesso/falha/retry/duplo toque/processamento em lote;
- testes do mês único, chevrons, barra de ações e traduções;
- testes de deltas semanais absolutos e estado sem movimentos;
- `check-visual-surface-governance`;
- `check-runtime-release-governance` para `.easignore`, changelog, credenciais e
  E2E iOS/Android.

## Riscos residuais

- O job Maestro gerenciado do EAS exige plano pago; por isso os binários
  continuam sendo construídos no EAS, mas o teste roda nos emuladores do
  GitHub Actions.
- A conta E2E precisa permanecer semeada com pendências/transações.
- Um crash nativo persistente exige stack trace/log; módulos nativos não devem
  ser removidos por tentativa e erro.

## Referências

- [Expo — E2E com Maestro em EAS Workflows](https://docs.expo.dev/tutorial/cicd/e2e-tests/)
- [Expo — jobs Maestro e artifacts](https://docs.expo.dev/eas/workflows/pre-packaged-jobs/)
- [Expo — builds para iOS Simulator](https://docs.expo.dev/build-reference/simulators/)
