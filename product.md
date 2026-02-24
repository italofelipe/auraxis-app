# Product Brief — auraxis-app

## Objetivo
Aplicativo mobile para gestao financeira pessoal com metas, carteira e visao de saude financeira.

## Escopo atual (MVP)
- Autenticacao
- Dashboard com saldo e transacoes
- Metas financeiras
- Consumo da API Auraxis via cliente HTTP tipado

## Fora de escopo imediato
- Open Finance nativo
- Automacoes complexas de investimento
- Recomendacao automatica sem supervisao

## Principios de UX
- Clareza financeira antes de densidade de informacao
- Fluxos curtos e sem ambiguidade
- Estado de erro e loading sempre explicitos

## Dependencias externas
- `auraxis-api` para contratos REST
- Segredos e configuracoes via `EXPO_PUBLIC_*` somente para dados publicos
