# AGENTS.md — auraxis-app

> Lido por Codex, Claude Code e qualquer agente de IA.
> Para Claude Code, o arquivo canônico é `CLAUDE.md`.

## Identidade

Mobile app do Auraxis · React Native · Expo SDK 54 · TypeScript strict · TanStack Query

## Passo 1 — Verificar coordenação

```bash
cat /caminho/para/auraxis-platform/.context/active_agents.json
gh issue list --label "agent:in-progress" --state open
```

Só comece se a issue estiver em "Todo" e não reclamada.

## Passo 2 — Registrar trabalho

Atualizar `.context/active_agents.json` na platform antes de escrever código.

## Setup

```bash
nvm use 25
npm install
# Quality gate:
npm run quality-check
```

## Convenção de branch

```
feat/claude-<desc>    feat/codex-<desc>
fix/claude-<desc>     fix/codex-<desc>
```

## Regras críticas — NÃO VIOLAR

- ❌ `git add .` ou `git add -A`
- ❌ commit direto em `main`
- ❌ `npm install <pkg>` para dependências nativas → usar `npx expo install <pkg>`
- ❌ modificar `app.json` sem aprovação humana explícita
- ❌ modificar `eas.json` sem aprovação humana explícita
- ❌ escrever em `.env*` (exceto `.env.example`)

## Quality gate

```bash
npm run quality-check
# Cobre: lint → typecheck → policy:check → contracts:check → test:coverage (≥85%)
```

## Feature flags — obrigatório para features novas

Toda feature nova deve ter entrada em `config/feature-flags.json`.
Verificar com: `node scripts/check-new-feature-flag-governance.cjs`

## Contratos de API

Antes de consumir endpoint novo:
```bash
npm run contracts:check
# Se falhar: npm run contracts:sync para atualizar snapshot
```

## PR rules

- Body deve conter `Closes #<número>`
- Screenshots obrigatórias para mudanças visuais
- Coverage ≥ 85%

## Finalizar trabalho

Ao abrir PR: remover entrada de `.context/active_agents.json`.
