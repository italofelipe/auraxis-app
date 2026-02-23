# quality_gates.md — auraxis-app

## Gates locais (obrigatórios antes de todo commit)

Execute nesta ordem:

```bash
# 1. Lint
npm run lint
# ou diretamente:
npx eslint . --ext .ts,.tsx --max-warnings 0

# 2. Type-check
npx tsc --noEmit

# 3. Testes unitários
npx jest --passWithNoTests
```

**Atalho — rodar tudo de uma vez:**
```bash
npm run lint && npx tsc --noEmit && npx jest --passWithNoTests
```

## Thresholds

| Gate | Threshold | O que falha |
|:-----|:----------|:------------|
| ESLint | 0 erros | Violações de estilo, uso de `any`, imports desnecessários |
| TypeScript | 0 erros | Tipos incompatíveis, `any` implícito |
| Jest | 100% passing | Qualquer teste quebrando |

> `--passWithNoTests` é aceito enquanto a suite de testes não está estabelecida (até APP8 — testes de componentes).

## Gates de CI (automáticos no GitHub Actions)

Ao abrir PR, o CI roda automaticamente:
- ESLint check
- TypeScript check
- Jest com coverage report

> Build nativo (EAS Build) é gate de CI separado, não de commit local. Não é necessário rodar `eas build` localmente.

## Guardrails de segurança

Antes de commitar, verificar manualmente:
- Nenhuma chave de API, token ou secret hardcoded
- Tokens JWT armazenados em `expo-secure-store` (nunca `AsyncStorage`)
- Nenhum `console.log` com dados de usuário em produção
- `app.json` não alterado sem aprovação (afeta stores e builds)

## Não é parte do gate de commit

- EAS Build (executado no CI após merge ou manualmente)
- EAS Update / OTA (executado após aprovação em produção)
- Review de acessibilidade (feito em PR review)
- Teste em dispositivo físico (responsabilidade do reviewer)
