# .context/ — auraxis-app

Contexto local do repositório `auraxis-app`.
Complementa (não substitui) o contexto global em `auraxis-platform/.context/`.

## Arquivos deste diretório

| Arquivo | O que contém | Quando ler |
|:--------|:-------------|:-----------|
| `README.md` | Este índice | Sempre — primeiro |
| `architecture.md` | Estrutura de diretórios, decisões de stack, fluxo de dados | Antes de criar componentes ou telas |
| `quality_gates.md` | Gates completos com comandos, thresholds e CI | Antes de commitar qualquer código |
| `templates/feature_card_template.md` | Card SDD para iniciar feature | Antes de implementar qualquer task nova |
| `templates/delivery_report_template.md` | Relatório de entrega por feature | Ao concluir um bloco de entrega |
| `handoffs/` | Handoffs operacionais por sessão/agente | Ao pausar ou encerrar bloco |
| `reports/` | Relatórios de entrega de features | Ao fechar task em `tasks.md` |

## Contexto global obrigatório (leia na platform)

Antes de qualquer trabalho, leia em ordem:

1. `auraxis-platform/.context/06_context_index.md`
2. `auraxis-platform/.context/07_steering_global.md`
3. `auraxis-platform/.context/08_agent_contract.md`
4. `auraxis-platform/.context/01_status_atual.md`
5. `auraxis-platform/.context/02_backlog_next.md`
6. `../CLAUDE.md` (este repo)
7. `../steering.md` (este repo)
