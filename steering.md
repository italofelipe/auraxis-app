# steering.md — auraxis-app

## Princípios técnicos

- **TypeScript strict** em todo o código (`strict: true` no tsconfig).
- **Expo SDK 54 + React Native 0.81.5** como plataforma.
- **Expo Router** como solução de navegação (file-based).
- **ESLint** com `eslint-config-expo` para lint.
- **Sem lógica de negócio no frontend** — toda regra fica em auraxis-api.
- **Contratos de API**: consumir apenas endpoints documentados e versionados em auraxis-api.
- **Testes**: Jest + React Native Testing Library.

## Convenções de código

- Componentes em `components/` são genéricos e reutilizáveis.
- Telas ficam em `app/` seguindo a convenção do Expo Router.
- Hooks customizados em `hooks/`.
- Constantes e temas em `constants/`.
- Tipos e interfaces em `types/` (nunca inline em componentes).
- Serviços HTTP em `services/` (um arquivo por domínio de API).
- Dados sensíveis em `expo-secure-store` — nunca em `AsyncStorage` sem criptografia.

## Quality Gates (obrigatórios antes de todo commit)

```bash
# 1. Lint
npm run lint
# ou equivalente:
npx eslint . --ext .ts,.tsx

# 2. Type-check
npx tsc --noEmit

# 3. Testes unitários
npx jest --passWithNoTests

# Comando combinado (rodar sempre antes de commitar):
npm run lint && npx tsc --noEmit && npx jest --passWithNoTests
```

> **Falha em qualquer gate = não commitar.** Registrar o bloqueio em `tasks.md` se for dependência de outro time.

### Thresholds

| Gate | Threshold | Observação |
|:-----|:----------|:-----------|
| ESLint | 0 erros | Warnings são aceitos com consciência |
| TypeScript | 0 erros | `strict: true` obrigatório |
| Jest | 100% dos testes passando | `--passWithNoTests` aceito enquanto suite não está estabelecida |

> **Nota sobre build:** Build nativo (EAS Build) não faz parte do gate de commit local — apenas do gate de CI. Não é necessário rodar `eas build` antes de commitar.

## Integrações externas

- **auraxis-api**: única fonte de verdade para dados.
- **Expo EAS Build**: pipeline de build mobile (a configurar — APP5).
- **Expo EAS Update**: OTA updates (a configurar).

## Segurança

- Nunca armazenar tokens em `AsyncStorage` sem criptografia.
- Usar `expo-secure-store` para dados sensíveis (tokens JWT, refresh tokens).
- Nunca expor chaves de API ou tokens no código.
- Nunca commitar `.env`, `.env.local`.
- Não incluir logs de produção que exponham dados de usuário.

## Referências

- Governança global: `auraxis-platform/.context/07_steering_global.md`
- Contrato de agente: `auraxis-platform/.context/08_agent_contract.md`
- Definição de pronto: `auraxis-platform/.context/23_definition_of_done.md`
- Workflow de sessão: `auraxis-platform/workflows/agent-session.md`
