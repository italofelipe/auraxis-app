# tasks.md — auraxis-app

Última atualização: 2026-02-22

## Legenda

| Símbolo | Significado |
|:--------|:------------|
| `[ ]` | Todo |
| `[~]` | In Progress |
| `[!]` | Blocked |
| `[x]` | Done |

**Prioridade:** P0 = bloqueante / P1 = alta / P2 = normal / P3 = baixa

---

## Ciclo A — Fundação e integração básica

### P0 — Pré-requisito para qualquer desenvolvimento

- [ ] **APP1** `chore` — Configurar lint e type-check (ESLint + TypeScript strict)
  - Critério: `npm run lint` e `tsc --noEmit` passam sem erros no scaffold atual.
  - Dependência: nenhuma
  - Commit: —
  - Risco residual: regras de ESLint podem conflitar com código gerado pelo Expo.

- [ ] **APP2** `chore` — Configurar cliente HTTP para auraxis-api
  - Critério: módulo `lib/api.ts` exporta client configurado com base URL via env var. Requisição de teste para `/health` retorna 200 em DEV.
  - Dependência: auraxis-api rodando em DEV
  - Commit: —
  - Risco residual: env vars no Expo requerem prefixo `EXPO_PUBLIC_` para exposição no client.

### P1 — Alta

- [ ] **APP3** `feat` — Estrutura de autenticação (contexto de sessão + telas de login)
  - Critério: usuário consegue autenticar com email/senha via `POST /auth/login`. Token armazenado em `expo-secure-store`. Logout limpa o store. Fluxo protegido redireciona para login se sem token.
  - Dependência: APP2
  - Commit: —
  - Risco residual: refresh token não implementado nesta fase — sessão expira e força re-login.

- [ ] **APP4** `feat` — Tela de dashboard (listagem de transações e saldo)
  - Critério: tela inicial exibe saldo atual e lista das últimas 20 transações consumindo `GET /transactions`. Loading state e error state tratados.
  - Dependência: APP3
  - Commit: —
  - Risco residual: paginação não implementada nesta fase.

### P2 — Normal

- [ ] **APP5** `chore` — Configurar CI (GitHub Actions)
  - Critério: workflow roda `lint` + `tsc` + `jest` (quando houver testes) a cada PR contra `main`. Build Expo não está no CI nesta fase (requer EAS).
  - Dependência: APP1
  - Commit: —

- [ ] **APP6** `chore` — Configurar EAS Build (Expo Application Services)
  - Critério: `eas build --platform android --profile preview` gera APK instalável. Perfis `development`, `preview` e `production` configurados em `eas.json`.
  - Dependência: conta EAS ativa
  - Commit: —

### P3 — Baixa / Futuro

- [ ] **APP7** `feat` — Tela de metas financeiras
  - Critério: a definir quando B10 (perfil investidor) estiver concluído em auraxis-api.
  - Dependência: B10 em auraxis-api, APP4

- [ ] **APP8** `test` — Testes de componentes com React Native Testing Library
  - Critério: componentes críticos (formulário de login, card de transação) com cobertura de render + interação básica.
  - Dependência: APP3

### Bloqueados

- [!] **APP6** — EAS Build requer conta EAS configurada e `eas login` autenticado.
  - Bloqueador: configuração manual da conta EAS pelo humano.

---

## Concluídos

- [x] Scaffold inicial Expo SDK 54 + React Native 0.81 | Data: 2026-02-22
- [x] Governance baseline: CLAUDE.md, .gitignore, tasks.md, steering.md | Data: 2026-02-22
- [x] Registrado como submodule em auraxis-platform | Commit: `05ca2ff` | Data: 2026-02-22
