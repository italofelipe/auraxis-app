# Product Brief — auraxis-app

## Objetivo

Aplicativo mobile (iOS + Android) de gestão financeira pessoal do Auraxis.
Foco B2C: usuário individual acompanhando saúde financeira, metas e transações.

## Escopo MVP1 — ativo agora

| Feature | Status | Flag |
|---------|--------|------|
| Autenticação (login/registro/recuperação) | Produção | sempre ativa |
| Dashboard (saldo, saúde financeira, cashflow) | Produção | sempre ativa |
| Transações (CRUD, filtros, tags, recorrência) | Produção | sempre ativa |
| Metas financeiras | Produção | sempre ativa |
| Carteira / Portfolio (ativos, cotações) | Produção | sempre ativa |
| Contas bancárias e cartões de crédito | Produção | sempre ativa |
| Orçamento (Budget envelopes) | Produção | sempre ativa |
| Focus Mode (1 número que importa) | Produção | `focus` flag |
| Onboarding wizard | Produção | sempre ativa |
| Perfil de investidor (questionário) | Produção | sempre ativa |
| Assinatura / Checkout Premium | Produção | sempre ativa |
| Push notifications (alertas) | Produção | sempre ativa |
| Fiscal / Notas fiscais | Congelado | fora do escopo B2C |

## MVP2 — roadmap (não implementar sem issue aprovada)

- Metas compartilhadas (casais/família)
- Radar de gastos compulsivos (LLM)
- Projeção de patrimônio (Net Worth Timeline)
- Financial Snapshot semanal (push/email)
- Widget PWA (web only)

## Fora de escopo (nunca implementar)

- Open Finance nativo (integração bancária automatizada)
- Automações de investimento sem supervisão
- Funcionalidades B2B (empresas, contabilidade)
- Features do módulo `fiscal/` — descontinuado para B2C

## Princípios de UX

- Clareza financeira antes de densidade de informação
- Fluxos curtos e sem ambiguidade
- Estado de erro e loading sempre explícitos
- Design system: tokens em `shared/theme/` (Tamagui)

## Dependências externas

- `auraxis-api` — contratos REST (snapshot em `contracts/`)
- `EXPO_PUBLIC_*` — apenas dados públicos (nunca secrets)
- BRAPI — cotações de ativos (via auraxis-api como proxy)
