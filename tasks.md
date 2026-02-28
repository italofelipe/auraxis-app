# tasks.md — auraxis-app

Última atualização: 2026-02-27

## Legenda

| Símbolo | Significado |
|:--------|:------------|
| `[ ]` | Todo |
| `[~]` | In Progress |
| `[!]` | Blocked |
| `[x]` | Done |

Regra operacional: manter somente 1 task em `In Progress` por vez para evitar drift do orquestrador.

**Prioridade:** P0 = bloqueante / P1 = alta / P2 = normal / P3 = baixa

---

## Diretriz global de layout (obrigatória para agentes)

Toda task de UI/layout no `auraxis-app` deve seguir, sem exceção:

1. Fonte visual canônica:
   - `/Users/italochagas/Desktop/projetos/auraxis-platform/designs/1920w default.png`
   - `/Users/italochagas/Desktop/projetos/auraxis-platform/designs/Background.svg`
2. Spec operacional obrigatório:
   - `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/30_design_reference.md`
3. Regras de aceite visual:
   - reproduzir hierarquia/composição do layout de referência (adaptando responsividade mobile sem descaracterizar a estrutura);
   - usar tokens de tema para 100% dos valores visuais (zero cor/spacing/radius hardcoded);
   - aplicar tipografia oficial (`Playfair Display` + `Raleway`) e grid de `8px`;
   - usar componentes-base do React Native Paper com extensão por tema.
4. Evidência obrigatória por task de UI:
   - screenshot local comparativa com a referência;
   - registro explícito de fidelidade visual e gaps no handoff/report da task.

---

## Ciclo A — Fundação e integração básica

### P0 — Pré-requisito para qualquer desenvolvimento

- [x] **APP1** `chore` — Configurar lint e type-check (ESLint + TypeScript strict)
  - Critério: `npm run lint` e `tsc --noEmit` passam sem erros no scaffold atual.
  - Dependência: nenhuma
  - Commit: `3eaa519`, `33ffc22`
  - Risco residual: regras de ESLint podem conflitar com código gerado pelo Expo.

- [x] **APP2** `chore` — Configurar cliente HTTP para auraxis-api
  - Critério: módulo `lib/api.ts` exporta client configurado com base URL via env var. Requisição de teste para `/health` retorna 200 em DEV.
  - Dependência: auraxis-api rodando em DEV
  - Commit: a definir (branch `chore/app9-test-baseline`)
  - Risco residual: healthcheck cobre conectividade base; autenticação/refresh serão cobertos no APP3.

- [x] **APP9** `chore` — Estabelecer baseline de testes para remover `--passWithNoTests`
  - Critério: pelo menos 1 suíte real cobrindo fluxo crítico inicial e scripts `test/test:coverage` sem `--passWithNoTests`.
  - Dependência: APP1
  - Commit: a definir (branch `chore/app9-test-baseline`)
  - Risco residual: baseline cobre apenas módulos críticos iniciais; ampliar escopo em `APP8` conforme novas features.

### P1 — Alta

- [~] **APP3** `feat` — Estrutura de autenticação (contexto de sessão + telas de login)
  - Critério: usuário consegue autenticar com email/senha via `POST /auth/login`. Token armazenado em `expo-secure-store`. Logout limpa o store. Fluxo protegido redireciona para login se sem token.
  - Dependência: APP2
  - Commit: —
  - Risco residual: refresh token não implementado nesta fase — sessão expira e força re-login.

- [ ] **APP4** `feat` — Tela de dashboard (listagem de transações e saldo)
  - Critério: tela inicial exibe saldo atual e lista das últimas 20 transações consumindo `GET /transactions`. Loading state e error state tratados.
  - Critério visual obrigatório: aderência ao blueprint de dashboard em `designs/1920w default.png` conforme `.context/30_design_reference.md`.
  - Dependência: APP3
  - Commit: —
  - Risco residual: paginação não implementada nesta fase.

- [ ] **APP10** `chore` — Padronizar UI mobile com React Native Paper customizado
  - Critério: tema base do Paper configurado com paleta oficial, tipografia (`Playfair Display` + `Raleway`) e grid de 8px.
  - Dependência: APP1
  - Commit: —
  - Risco residual: telas legadas podem conviver temporariamente com componentes não migrados.

- [x] **APP11** `chore` — Adotar TanStack Query para server-state no app
  - Critério: `QueryClientProvider` global configurado e primeiro fluxo de integração com API usando `@tanstack/react-query` (cache/retry/invalidation).
  - Dependência: APP2
  - Commit: —
  - Risco residual: transição inicial pode coexistir com hooks legados de fetch manual.

### P2 — Normal

- [x] **APP5** `chore` — Configurar CI (GitHub Actions)
  - Critério: workflow roda `lint` + `tsc` + `jest` (quando houver testes) a cada PR contra `main`. Build Expo não está no CI nesta fase (requer EAS).
  - Dependência: APP1
  - Commit: `3eaa519`, `884122c`

- [ ] **APP6** `chore` — Configurar EAS Build (Expo Application Services)
  - Critério: `eas build --platform android --profile preview` gera APK instalável. Perfis `development`, `preview` e `production` configurados em `eas.json`.
  - Dependência: conta EAS ativa
  - Commit: —
  - Status atual (2026-02-25): `eas init` + `eas build:configure --platform all` concluídos; pendente executar build preview completo e validar artifact instalável.

- [ ] **APP12** `chore` — Preparar publicação contínua para Play Store/App Store
  - Critério: trilhas/configuração de release prontas (Google Play Internal + TestFlight), com credenciais seguras e checklist de submissão documentado.
  - Dependência: APP6
  - Commit: —
  - Risco residual: aprovação de loja e requisitos legais variam por plataforma/região.

- [x] **APP13** `chore` — Configurar versionamento automático do app
  - Critério: incremento automático de versão (`version`, `versionCode`, `buildNumber`) e changelog por Conventional Commits, sem ajuste manual.
  - Dependência: APP5
  - Commit: —
  - Risco residual: alinhamento incorreto com pipelines EAS pode gerar versões rejeitadas nas lojas.

- [x] **APP14** `chore` — Integrar feature toggle OSS no app
  - Critério: runtime de flags integrado com fallback seguro e provider remoto por ambiente (`unleash`), com primeiro flag (`app.tools.salary-raise-calculator`) controlando feature real do catálogo de ferramentas.
  - Dependência: APP2
  - Commit: `chore/plt4-runtime-flags-integration`, `chore/plt4-oss-provider-integration`, `chore/app-plt4-3-provider-bootstrap`
  - Risco residual: pendente apenas rotina contínua de remoção de código morto após expiração de flag.

- [x] **APP17** `chore` — Automatizar hygiene de feature flags no CI
  - Critério: catálogo versionado de flags com metadados obrigatórios e validação bloqueante no CI/local parity para owner, removeBy e expiração.
  - Dependência: APP14
  - Commit: —
  - Risco residual: ainda depende de disciplina para remover código morto após cleanup de flag.

- [x] **APP18** `chore` — Scaffold administrativo pré-feature (providers, estado, contratos, hooks e utilitários)
  - Critério: `QueryClientProvider`, `PaperProvider` customizado, estado global com `zustand` (sem ContextAPI), cliente HTTP (`axios`) e contratos tipados de auth/dashboard/carteira/ferramentas configurados.
  - Dependência: APP1, APP2
  - Commit: a definir (branch `feat/foundation-ui-data-scaffold`)
  - Risco residual: endpoints finais do backend ainda podem evoluir e exigir ajustes de contrato.

- [x] **APP19** `feat` — Telas placeholder do ciclo inicial (login, forgot-password, dashboard, carteira e ferramentas)
  - Critério: telas navegáveis via Expo Router com conteúdo placeholder, formulário validado com `react-hook-form` + `zod`, hooks de query/mutation prontos para integração real.
  - Critério visual obrigatório: placeholders já devem respeitar estrutura/hierarquia dos assets canônicos em `designs/`.
  - Dependência: APP18
  - Commit: a definir (branch `feat/foundation-ui-data-scaffold`)
  - Risco residual: falta aplicar design final e refino de UX quando o pacote visual estiver pronto.

- [ ] **APP15** `chore` — Deploy mínimo do frontend mobile (baseline distribuível)
  - Critério: build de preview distribuída para teste interno (Android/iOS), com evidência de instalação e execução do fluxo inicial.
  - Dependência: APP12
  - Commit: —
  - Risco residual: baseline pode operar com escopo funcional parcial no primeiro release interno.

### P3 — Baixa / Futuro

- [ ] **APP7** `feat` — Tela de metas financeiras
  - Critério: a definir quando B10 (perfil investidor) estiver concluído em auraxis-api.
  - Dependência: B10 em auraxis-api, APP4

- [ ] **APP8** `test` — Testes de componentes com React Native Testing Library
  - Critério: componentes críticos (formulário de login, card de transação) com cobertura de render + interação básica.
  - Dependência: APP3

- [ ] **APP16** `feat` — Aba Ferramentas: calculadora "Pedir aumento"
  - Critério: usuário informa salário inicial/data-base, impostos/abatimentos e aumento real desejado; app mostra recomposição inflacionária + aumento real alvo.
  - Dependência: APP4, endpoint de cálculo no backend
  - Commit: —
  - Prioridade de produto: baixa

## Concluídos

- [x] Scaffold inicial Expo SDK 54 + React Native 0.81 | Data: 2026-02-22
- [x] Governance baseline: CLAUDE.md, .gitignore, tasks.md, steering.md | Data: 2026-02-22
- [x] Registrado como submodule em auraxis-platform | Commit: `05ca2ff` | Data: 2026-02-22
- [x] APP1 concluído: lint + typecheck + strict mode estabilizados | Commits: `3eaa519`, `33ffc22` | Data: 2026-02-23
- [x] APP5 concluído: pipeline CI com gates de qualidade e segurança | Commits: `3eaa519`, `884122c` | Data: 2026-02-23
- [x] CI fix: comentário de bundle-size no PR tornado resiliente a `403` de integração GitHub e audit npm ajustado para gate com allowlist temporária do advisory `GHSA-3ppc-4f35-3m26` (cadeia Expo) | Data: 2026-02-24
- [x] CI hardening: `dependency-review-action` ajustado para modo bloqueante (sem fallback permissivo) | Data: 2026-02-24
- [x] CI fix: Sonar migrado para `sonarqube-scan-action@v5` e `sonar.sources=.` para evitar erro por diretórios inexistentes | Data: 2026-02-24
- [x] CI fix: Sonar pinado com SHA completo (`sonarqube-scan-action@v6`) e organização Sonar corrigida para `sensoriumit` | Data: 2026-02-24
- [x] CI security fix: permissões de workflows movidas de nível global para nível de job (least privilege) para atender policy/Sonar | Data: 2026-02-24
- [x] CI hardening: Sonar padronizado para CI scanner sempre ativo (Automatic Analysis deve permanecer desabilitado no SonarCloud) | Data: 2026-02-24
- [x] CI fix: `jest.config.js` corrigido (`setupFilesAfterFramework` -> `setupFilesAfterEnv`) para eliminar warning de configuração inválida | Data: 2026-02-24
- [x] CI compat: `dependency-review-action` com fallback controlado para repo sem Dependency Graph suportado/habilitado | Data: 2026-02-24
- [x] CI hardening: Sonar scanner estrito reativado após desativação do Automatic Analysis no SonarCloud | Data: 2026-02-24
- [x] APP9 concluído: baseline de testes reais criado, `--passWithNoTests` removido dos scripts e coverage validado no gate local | Data: 2026-02-24
- [x] Lint hardening: perfil ESLint estrito aplicado (estilo + complexidade + disciplina TypeScript), com padrão de formatação (`.prettierrc.json`) e `--max-warnings 0` no script de lint | Data: 2026-02-24
- [x] APP2 concluído: cliente HTTP (`lib/api.ts`) com base URL por `EXPO_PUBLIC_API_URL`, healthcheck `/health` e testes unitários dedicados | Data: 2026-02-24
- [x] SDD hardening: templates locais (`feature_card`/`delivery_report`) + `product.md` + diretórios `handoffs/reports` adicionados para execução autônoma | Data: 2026-02-24
- [x] CI security hardening: `npm ci` do pipeline alterado para `npm ci --ignore-scripts` | Data: 2026-02-24
- [x] Dependency review hardening: fallback permissivo removido (`continue-on-error`) para enforcement real no PR gate | Data: 2026-02-24
- [x] Security fix: normalização de base URL refatorada para algoritmo linear (`removeTrailingSlashes`) sem regex suscetível a backtracking/ReDoS | Data: 2026-02-24
- [x] Quality gate: coverage mínimo padronizado em 85% (lines/functions/statements/branches) com validação local em `npm run test:coverage` | Data: 2026-02-24
- [x] CI compat fix: dependency-review com detecção automática de `Dependency Graph` e fallback controlado quando repositório não suportar o check nativo | Data: 2026-02-24
- [x] CI parity local: criado `scripts/run_ci_like_actions_local.sh` + `scripts/ci-audit-gate.js`; workflow de audit passou a reutilizar script compartilhado | Data: 2026-02-24
- [x] Sonar code smell fix: `String#charCodeAt()` substituído por `String#codePointAt()` em normalização de URL | Data: 2026-02-24
- [x] Sonar coverage fix: escopo de análise (`sonar.sources/inclusions`) alinhado ao baseline coberto no `lcov` para eliminar falso negativo de coverage global no scaffold | Data: 2026-02-24
- [x] Governança UI atualizada: paleta, tipografia, grid 8px, proibição de Tailwind e baseline de React Native Paper + TanStack Query registradas em `steering.md` e `CODING_STANDARDS.md` | Data: 2026-02-24
- [x] CI simplification: removido gate sintético `ci-passed`; branch protection passa a exigir checks reais do pipeline | Data: 2026-02-24
- [x] PLT3 foundation (app): `release-please` configurado com PR/tag/changelog automáticos (`.release-please-*` + workflow) | Data: 2026-02-24
- [x] PLT2 foundation (app): `eas.json` criado com perfis de build/submit e workflow manual de store release (`store-release.yml`) | Data: 2026-02-24
- [x] PLT5 foundation (app): deploy mínimo via artifact web + build preview opcional no EAS (`deploy-minimum.yml`) | Data: 2026-02-24
- [x] PLT4.1 (app): catálogo de flags em `config/feature-flags.json` + gate `Feature Flags Hygiene` no CI + validação local em `scripts/run_ci_like_actions_local.sh` | Data: 2026-02-25
- [x] PLT4.3 (app): runtime de flags passou a aceitar namespace canônico `AURAXIS_*` como fallback de `EXPO_PUBLIC_*` + runbook atualizado para bootstrap central por ambiente | Data: 2026-02-28
- [x] APP6 avanço: `eas init` concluído com `owner`/`projectId` em `app.json` e `eas build:configure --platform all` validado no ambiente local | Data: 2026-02-25
- [x] APP18 concluído: fundação administrativa mobile configurada (`react-native-paper` + `zustand` + `@tanstack/react-query` + contratos tipados + cliente HTTP + secure storage) | Data: 2026-02-26
- [x] APP19 concluído: telas placeholder de login/forgot-password/dashboard/carteira/ferramentas publicadas com validação `zod` + `react-hook-form` e hooks prontos para integração de dados | Data: 2026-02-26
- [x] Guardrail de governança frontend reforçado: `scripts/check-frontend-governance.cjs` integrado em `quality-check`, lint-staged, CI (`frontend-governance`) e parity local, com enforcement de `shared/*` canônico + token-first styling + TS-only | Data: 2026-02-27
- [x] Governança cross-platform sincronizada: referências obrigatórias ao guideline unificado (`.context/32_frontend_unified_guideline.md`) e ao fluxo de `Feature Contract Pack` adicionadas em `steering.md` e `CODING_STANDARDS.md` | Data: 2026-02-27
- [x] Contract automation foundation: `contracts:sync` + `contracts:check`, geração tipada OpenAPI (`shared/types/generated/openapi.ts`), baseline de packs e job `Contract Smoke` adicionados ao CI/local parity | Data: 2026-02-27
- [x] PR governance hardening: template obrigatório de PR adicionado em `.github/pull_request_template.md` com checklist de contrato, validação e guardrails frontend | Data: 2026-02-27
- [x] Autonomy hardening: `dependency-review.yml` em modo estrito (sem fallback de compatibilidade), tornando Dependency Review bloqueante em todo PR | Data: 2026-02-28
