# Frontend Contracts (App)

Este diretório versiona os artefatos usados pelo gate de contrato no `auraxis-app`.

## Arquivos

- `openapi.snapshot.json`: snapshot canônico da API para geração de tipos.
- `feature-contract-baseline.json`: baseline dos `Feature Contract Packs` consumidos.

## Comandos

- `npm run contracts:sync`: atualiza snapshot/tipos/baseline.
- `npm run contracts:check`: valida drift de contrato (CI bloqueante).
