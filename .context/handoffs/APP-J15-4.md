# APP-J15-4 - Parcelado vs a vista no App

## O que foi feito
- adicionada a experiencia mobile da ferramenta `parcelado vs a vista` em [`app/(private)/installment-vs-cash.tsx`](/Users/italochagas/Desktop/projetos/_worktrees/auraxis-app-j15-4-mobile/app/(private)/installment-vs-cash.tsx);
- criada uma camada modular para contratos, validacao, client API, queries e mutations da feature;
- integrado o catalogo de ferramentas ao novo fluxo, com navegacao a partir de [`app/(private)/ferramentas.tsx`](/Users/italochagas/Desktop/projetos/_worktrees/auraxis-app-j15-4-mobile/app/(private)/ferramentas.tsx);
- implementados `save` autenticado, historico real via `/simulations` e gating premium via `/entitlements/check`;
- adicionados testes unitarios e de tela para validacao, client, historico e renderizacao principal.

## O que foi validado
- `npm run typecheck`
- `npm run lint`
- `npm run policy:check`
- `npm run contracts:check`
- `npm run quality-check`
- `npx expo export --platform all --output-dir dist`
- `git diff --check`

## Riscos pendentes
- o `expo export` passou, mas os bundles ficaram em aproximadamente `8.25 MB` no iOS e `8.24 MB` no Android, acima do hard limit de `8 MB` documentado no CI;
- o bloqueio de upgrade premium no App ainda mostra apenas o feedback de gating; ainda nao existe tela de planos/checkout no mobile para fechar essa jornada;
- o `contracts:check` do App continua tratando o diretorio remoto de contract packs como vazio, o que nao bloqueia este slice, mas reduz o valor do gate.

## Proximo passo
- abrir PR do `J15-4` no `auraxis-app`;
- acompanhar o CI, especialmente `expo-bundle` e `bundle-analysis`;
- decidir se tratamos o orçamento de bundle como follow-up dedicado ou se precisamos otimizar algo antes do merge.
