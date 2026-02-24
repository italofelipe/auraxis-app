# quality_gates.md — auraxis-app

> Gates de qualidade obrigatórios para o aplicativo mobile do Auraxis.
> Atualizado: 2026-02-23 — stack completa (jest-expo + Gitleaks + TruffleHog + SonarCloud)

---

## 1. Gates locais — obrigatórios antes de todo commit

Execute nesta ordem:

```bash
# 1. Lint (ESLint + eslint-config-expo)
npm run lint

# 2. Type-check
npm run typecheck

# 3. Testes + coverage
npm run test:coverage

# Atalho — tudo de uma vez (obrigatório antes de commitar):
npm run quality-check

# Paridade CI local (ambiente dockerizado Node 22, igual ao runner Linux):
npm run ci:local
```

> Se qualquer gate falhar: **não commitar**. Corrigir o problema primeiro.

---

## 2. Thresholds locais (jest.config.js)

| Gate | Threshold | Arquivo de config |
|:-----|:----------|:------------------|
| ESLint | 0 erros, 0 warnings (--max-warnings 0) | `eslint.config.js` |
| TypeScript | 0 erros | `tsconfig.json` (strict: true) |
| Jest — testes passando | 100% | `jest.config.js` |
| Jest — coverage lines | ≥ 85% | `jest.config.js#coverageThreshold` |
| Jest — coverage functions | ≥ 85% | `jest.config.js#coverageThreshold` |
| Jest — coverage statements | ≥ 85% | `jest.config.js#coverageThreshold` |
| Jest — coverage branches | ≥ 85% | `jest.config.js#coverageThreshold` |

---

## 3. Gates de CI — automáticos no GitHub Actions

### Jobs e thresholds

| Job | O que verifica | Threshold | Bloqueia merge? |
|:----|:--------------|:----------|:----------------|
| `lint` | ESLint | 0 erros | ✅ sim |
| `typecheck` | TypeScript strict | 0 erros | ✅ sim |
| `test` | Jest + coverage | ≥ 85% (lines/functions/statements/branches) | ✅ sim |
| `expo-bundle` | JS bundle compila | sem erros | ✅ sim |
| `bundle-analysis` | Tamanho do bundle | ≤ 6 MB hard (Android/iOS) | ✅ sim (PR apenas) |
| `secret-scan-gitleaks` | Secrets no código | 0 detectados | ✅ sim |
| `secret-scan-trufflehog` | Secrets com entropia | 0 verificados | ✅ sim |
| `audit` | CVEs em deps instaladas | 0 high/critical | ✅ sim |
| `sonarcloud` | Análise estática | quality gate pass | ✅ sim |

> **Secret Sonar:** GitHub Secret = `SONAR_AURAXIS_APP_TOKEN` · `.env` local = `SONAR_AURAXIS_APP_TOKEN=<token>`
| `commitlint` | Conventional Commits | válido | ✅ sim (PR apenas) |
| `dependency-review` | CVEs em novas deps | 0 high/critical | ✅ sim (PR apenas) |

### Bundle size — thresholds por plataforma

| Plataforma | Aviso | Hard limit (falha CI) |
|:-----------|:------|:----------------------|
| Android | > 3 MB | > 6 MB |
| iOS | > 3 MB | > 6 MB |

---

## 4. Sobre o runner de testes

**Por que jest-expo e não Vitest?**

Vitest não tem suporte a React Native. O `jest-expo` é necessário porque:
- Resolve imports `.ios.tsx` / `.android.tsx` (platform-specific)
- Configura automaticamente o babel-jest para React Native
- Inclui mocks do Expo SDK (expo-constants, expo-secure-store, etc.)
- É a ferramenta recomendada pela Expo em sua documentação oficial

Não existe alternativa viável com Vitest para React Native no estado atual do ecossistema (2026).

---

## 5. Guardrails de segurança — verificação manual

Checklist manual antes de commitar:
- [ ] Nenhuma chave de API ou token hardcoded
- [ ] `console.log` com dados de usuário removido antes de produção
- [ ] Tokens JWT em `expo-secure-store` (nunca `AsyncStorage`)
- [ ] `app.json` não alterado sem aprovação (afeta bundle identifier e stores)
- [ ] `.env*` em `.gitignore` e não staged

---

## 6. Executando testes localmente

### Testes unitários

```bash
# Rodar todos os testes
npm run test

# Modo watch (desenvolvimento)
npm run test:watch

# Com coverage completo
npm run test:coverage

# Arquivo específico
npx jest src/hooks/useBalance.test.ts

# Por pattern de nome
npx jest --testNamePattern="useBalance"

# Limpar cache do Jest (útil quando módulos mudam)
npx jest --clearCache
```

### Debugging de testes

```bash
# Verbose — ver nome de cada teste
npx jest --verbose

# Forçar re-execução sem cache
npx jest --no-cache

# Apenas testes que falharam na última execução
npx jest --onlyFailures
```

### Detox E2E (quando macOS runner disponível)

```bash
# Build do app para simulador iOS
npm run detox:build:ios

# Rodar testes E2E no simulador iOS
npm run detox:test:ios

# Build para Android
npm run detox:build:android

# Rodar testes E2E no emulador Android
npm run detox:test:android
```

> Detox requer macOS com Xcode instalado (iOS) ou Android SDK (Android).
> No CI, usar self-hosted runner com macOS. Job está comentado no `ci.yml`.

---

## 7. Mocks disponíveis

O `jest.setup.ts` configura automaticamente:

| Mock | O que faz |
|:-----|:----------|
| `expo-router` | Mock completo (useRouter, useLocalSearchParams, Link, Stack, Tabs) |
| `expo-constants` | Mock com `expoConfig.name` e `expoConfig.slug` |
| `__mocks__/svgMock.ts` | Retorna componente `<View testID="svg-mock" />` |
| `__mocks__/imageMock.ts` | Retorna string `'image-mock'` |
| `@testing-library/jest-native` | Matchers extras (toBeVisible, toHaveText, etc.) |

Para adicionar mocks de módulos nativos adicionais:
```typescript
// jest.setup.ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))
```

---

## 8. O que NÃO faz parte do gate de commit

| Item | Por quê |
|:-----|:--------|
| EAS Build nativo | Executado no CI/EAS após merge |
| EAS Update / OTA | Executado após aprovação em produção |
| Detox E2E | Requer macOS runner — executado separadamente |
| Teste em dispositivo físico | Responsabilidade do reviewer |
| Review de acessibilidade manual | Feito no PR review |

---

## 9. Troubleshooting

| Sintoma | Causa provável | Solução |
|:--------|:--------------|:--------|
| `Cannot find module 'expo-...'` em teste | Mock ausente | Adicionar mock em `jest.setup.ts` |
| `SyntaxError: Unexpected token` | Módulo ESM não transformado | Adicionar ao `transformIgnorePatterns` em `jest.config.js` |
| Coverage cai abaixo do threshold | Código novo sem teste | Escrever testes antes do merge |
| `act()` warnings | Atualização de estado assíncrona | Envolver em `act()` ou usar `waitFor()` |
| TruffleHog falsa positiva | Pattern similar a secret | Adicionar ao allowlist |
| SonarCloud quality gate falha | Coverage caiu ou dívida técnica | Ver dashboard em sonarcloud.io |
