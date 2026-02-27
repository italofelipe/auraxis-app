# steering.md — auraxis-app

> Documento canônico de governança técnica para o aplicativo mobile do Auraxis.
> Vinculante para todos os agentes e desenvolvedores.
> Atualizado: 2026-02-27

---

## Stack técnica

| Camada | Tecnologia | Versão |
|:-------|:-----------|:-------|
| Plataforma | React Native | 0.81.5 |
| SDK | Expo SDK | ~54.0 |
| Navegação | Expo Router v6 | ~6.0 |
| Linguagem | TypeScript strict | ~5.9 |
| Gerenciador de pacotes | npm | — |
| Lint | ESLint + eslint-config-expo | ^9.25 |
| Formatação | Prettier | ^3.8 |
| Testes unitários | jest-expo + @testing-library/react-native | ^54.0 / ^13.0 |
| Testes E2E | Detox (scaffold — requer macOS runner) | — |
| UI base | React Native Paper | ^5.x |
| Estado de servidor | TanStack Query (React) | ^5.x |
| Análise estática | SonarCloud | — |
| Secret scan | Gitleaks + TruffleHog | — |
| Dep update | Dependabot | auto-merge patch; manual para RN/React minor |

> **Por que Jest e não Vitest?**
> Vitest não tem suporte a React Native. Não existe `@vitest/react-native` oficial.
> O ecossistema RN depende do jest-expo para resolução de módulos nativos,
> mocks do Expo SDK e transformações por plataforma (.ios.tsx / .android.tsx).
> Trocar para Vitest exigiria implementar toda essa infra do zero, sem suporte da comunidade.

---

## Diretriz de UI e Design System

- Paleta oficial: `#262121`, `#ffbe4d`, `#413939`, `#0b0909`, `#ffd180`, `#ffab1a`.
- Tipografia oficial: `Playfair Display` (headings) + `Raleway` (body).
- Grid base: `8px` (spacing estrutural em múltiplos de 8).
- Componentes mobile devem partir de base **React Native Paper** customizada para o tema Auraxis.
- Componentes novos devem usar prioritariamente React Native Paper; customizações devem ocorrer por extensão/composição e wrappers internos.
- É proibido usar valores literais de cor, spacing, radius, shadow, font-size e line-height em telas/componentes. Usar tokens semânticos.
- **Tailwind não é permitido** neste repositório.
- Server-state remoto deve preferir `@tanstack/react-query` para cache, retry e invalidação.

---

## Princípios técnicos

- **TypeScript strict** em todo o código — `strict: true` no tsconfig, sem exceções.
- **Sem lógica de negócio no frontend** — toda regra de negócio fica em `auraxis-api`.
- **Contratos de API**: consumir apenas endpoints documentados e versionados.
- **Plataforma primeiro** — usar APIs nativas do RN antes de bibliotecas externas.
- **Segurança por padrão** — token em `expo-secure-store`, nunca em `AsyncStorage`.
- **Testes não são opcionais** — toda lógica nova tem teste antes de merge.
- **Performance mobile** — bundle Android/iOS ≤ 6 MB (hard limit no CI).
- **UI consistente por contrato** — React Native Paper custom + tokens oficiais são obrigatórios.
- **Token-first styling** — qualquer estilo visual deve referenciar tokens; valores soltos no código são não conformidade.
- **Server-state com TanStack Query** — evitar fetch manual distribuído em telas/componentes.

---

## Convenções de código

| Diretório | O que vai aqui |
|:----------|:---------------|
| `app/` | Telas (Expo Router — file-based routing) |
| `components/` | Componentes reutilizáveis |
| `hooks/` | Hooks customizados (prefixo `use`) |
| `stores/` | Estado global de cliente |
| `services/` | Chamadas HTTP (um arquivo por domínio de API) |
| `utils/` | Funções puras sem side-effects |
| `types/` | Interfaces e tipos TypeScript |
| `types/api/` | Tipos do contrato com auraxis-api |
| `shared/` | Código compartilhado (`shared/components`, `shared/types`, `shared/validators`, `shared/utils`) |
| `constants/` | Constantes e temas de cor |
| `__tests__/` | Testes unitários (alternativa a co-localização) |
| `e2e/` | Testes Detox (scaffold — requer macOS runner) |
| `__mocks__/` | Mocks globais (SVG, imagens) |

**Variáveis de ambiente:**
- Usar `expo-constants` para acessar variáveis do `app.json`/`app.config.js`
- **Nunca** hardcodar URLs de API ou tokens no código
- Segredos em `expo-secure-store`, nunca em `AsyncStorage`

---

## Quality Gates — obrigatórios antes de todo commit

Execute na ordem:

```bash
# 1. Lint
npm run lint

# 2. Type-check
npm run typecheck

# 3. Guardrails de governança frontend
npm run policy:check

# 4. Testes unitários com coverage
npm run test:coverage

# Comando combinado (obrigatório antes de commitar):
npm run quality-check
```

> **Falha em qualquer gate = não commitar.**
> Se o bloqueio é dependência de outro time, registrar em `tasks.md` e abrir issue.

### Thresholds locais (jest.config.js)

| Gate | Threshold | Falha quando |
|:-----|:----------|:-------------|
| ESLint | 0 erros | Qualquer violação de lint |
| TypeScript strict | 0 erros | `any` implícito, tipos incompatíveis |
| Jest — testes passando | 100% | Qualquer teste quebrando |
| Jest — coverage lines | ≥ 85% | Cobertura abaixo do threshold |
| Jest — coverage functions | ≥ 85% | Cobertura abaixo do threshold |
| Jest — coverage statements | ≥ 85% | Cobertura abaixo do threshold |
| Jest — coverage branches | ≥ 85% | Cobertura de branches abaixo |

### Thresholds de CI (automáticos — GitHub Actions)

| Gate CI | Threshold | Job |
|:--------|:----------|:----|
| Bundle Android | ≤ 6 MB hard limit | `bundle-analysis` |
| Bundle iOS | ≤ 6 MB hard limit | `bundle-analysis` |
| CVEs em novas deps | 0 high/critical | `dependency-review` |
| Secrets detectados | 0 | `gitleaks` + `trufflehog` |
| SonarCloud quality gate | Pass | `sonarcloud` |
| JS bundle compila | sem erros | `expo-bundle` |

---

## Pipeline CI — 10 jobs

```
push / PR → master
│
├── lint              (ESLint — 0 erros)
├── typecheck         (tsc --noEmit — 0 erros)
├── frontend-governance (TS-only + shared dirs + token-first styling)
├── test              (jest-expo + coverage ≥ 85%)
│
├── expo-bundle       (export android — valida que bundle JS compila)
│   └── bundle-analysis   (comenta tamanho no PR; hard limit 6 MB)
│
├── secret-scan-gitleaks
├── secret-scan-trufflehog
├── audit             (npm audit --audit-level=high)
├── sonarcloud        (análise estática + coverage)
└── commitlint        (apenas em PR — Conventional Commits)

```

Workflows adicionais:
- `dependency-review.yml` — bloqueia PRs com CVEs ≥ high em novas deps
- `auto-merge.yml` — squash-merge automático de PRs Dependabot (patch; minor não-RN)

> **SonarCloud:** operar exclusivamente em modo CI scanner (Automatic Analysis desabilitado no painel do projeto).
> **Detox E2E:** job `detox-e2e` está no CI mas comentado.
> Requer self-hosted runner com macOS + Xcode. Descomentar quando infra disponível.

---

## Escrevendo testes

### Estrutura de arquivos

```
components/
  Button/
    Button.tsx
    Button.test.tsx       ← co-localizado com o componente

hooks/
  useBalance.ts
  useBalance.test.ts      ← co-localizado com o hook

utils/
  currency.ts
  currency.test.ts

__tests__/
  integration/
    auth.test.ts          ← testes de integração

e2e/
  app.e2e.ts             ← Detox (scaffold — requer macOS runner)
```

### Testes unitários (jest-expo + @testing-library/react-native)

```typescript
// Button.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import Button from './Button'

describe('Button', () => {
  it('renders label correctly', () => {
    const { getByText } = render(<Button label="Confirmar" onPress={() => {}} />)
    expect(getByText('Confirmar')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Enviar" onPress={onPress} />)
    fireEvent.press(getByText('Enviar'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Enviar" onPress={onPress} disabled />)
    fireEvent.press(getByText('Enviar'))
    expect(onPress).not.toHaveBeenCalled()
  })
})
```

### Testando hooks

```typescript
// useBalance.test.ts
import { renderHook, act } from '@testing-library/react-native'
import { useBalance } from './useBalance'

describe('useBalance', () => {
  it('returns initial balance as zero', () => {
    const { result } = renderHook(() => useBalance())
    expect(result.current.balance).toBe(0)
  })

  it('updates balance correctly', () => {
    const { result } = renderHook(() => useBalance())
    act(() => result.current.addTransaction(100))
    expect(result.current.balance).toBe(100)
  })
})
```

### O que deve ter teste

| O que | Obrigatório | Tipo |
|:------|:-----------:|:-----|
| Hooks customizados (`hooks/`) | ✅ | Unitário (Jest) |
| Utilitários (`utils/`) | ✅ | Unitário (Jest) |
| Serviços HTTP | ✅ | Unitário (mock de `fetch`) |
| Componentes com lógica condicional | ✅ | Unitário (Jest + RNTL) |
| Fluxos críticos (login, pagamento) | ✅ | Detox E2E (quando runner disponível) |
| Componentes de apresentação pura | ⚠️ | Opcional |
| Navegação (Expo Router) | ⚠️ | Mock no jest.setup.ts |

---

## Segurança

- **Nunca** armazenar tokens JWT em `AsyncStorage` — usar `expo-secure-store`
- **Nunca** expor chaves de API ou URLs de backend em código-fonte
- **Nunca** commitar `.env`, `.env.local`
- Verificar `app.json` antes de commitar — afeta stores e builds
- Secret scan automático via Gitleaks + TruffleHog no CI (bloqueia PR)
- CVEs em novas deps bloqueados pelo Dependency Review Action

---

## Definição de pronto — checklist por PR

```
[ ] npm run quality-check passou (lint + typecheck + test:coverage)
[ ] Testes escritos para toda lógica nova (hooks, utils, componentes com lógica)
[ ] Coverage não regrediu abaixo de 85% (lines/functions/branches)
[ ] Nenhum `any` implícito ou `@ts-ignore` sem comentário explicativo
[ ] Tokens e segredos em expo-secure-store (nunca AsyncStorage)
[ ] Nenhum secret hardcoded (Gitleaks + TruffleHog verificam automaticamente)
[ ] Mensagem de commit em Conventional Commits (commitlint valida)
[ ] PR com título claro e descrição do que muda e por quê
[ ] CI verde (todos os 10 jobs passando)
```

---

## Referências

- Governança global: `auraxis-platform/.context/07_steering_global.md`
- Contrato de agente: `auraxis-platform/.context/08_agent_contract.md`
- Playbook de qualidade: `auraxis-platform/.context/25_quality_security_playbook.md`
- Definição de pronto: `auraxis-platform/.context/23_definition_of_done.md`
- Quality gates detalhados: `.context/quality_gates.md`
- Workflow de sessão: `auraxis-platform/workflows/agent-session.md`
