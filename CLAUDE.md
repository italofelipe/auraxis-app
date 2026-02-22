# CLAUDE.md — auraxis-app

## Identidade

Repositório do aplicativo mobile do Auraxis.
Stack: React Native + Expo SDK 54 + TypeScript.

Este repo é um **submodule** de `auraxis-platform`.
Sempre trabalhe a partir da raiz da platform quando possível.

## Session Bootstrap (MANDATORY — execute em ordem)

Antes de qualquer ação, leia a partir da platform:

1. `auraxis-platform/.context/06_context_index.md` — índice de contexto
2. `auraxis-platform/.context/07_steering_global.md` — governança global
3. `auraxis-platform/.context/08_agent_contract.md` — contrato de agente
4. `auraxis-platform/.context/01_status_atual.md` — status atual
5. `auraxis-platform/.context/02_backlog_next.md` — prioridades
6. Este arquivo — diretiva do repo mobile

## Estrutura do repo

```
auraxis-app/
  app/           # Telas e navegação (Expo Router)
  components/    # Componentes reutilizáveis
  constants/     # Constantes e temas
  hooks/         # Custom hooks
  assets/        # Imagens, fontes, ícones
  scripts/       # Utilitários de desenvolvimento
```

## Stack e ferramentas

- **Framework**: Expo SDK 54 / React Native 0.81.5
- **Navegação**: Expo Router (file-based)
- **Linguagem**: TypeScript strict
- **Lint**: ESLint (eslint-config-expo)
- **Runtime**: iOS, Android, Web (via expo-web-browser)

## Operação local

```bash
# Instalar dependências
npm install

# Iniciar dev server
npm start          # ou expo start

# Plataformas específicas
npm run android
npm run ios
npm run web

# Lint
npm run lint
```

## Convenções

- **Commits**: Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`)
- **Branch**: `type/scope-descricao` (ex: `feat/auth-login-screen`)
- **Nunca** commitar direto em `master`
- **Nunca** expor tokens, keys ou segredos em código

## Limites operacionais

### Pode fazer autonomamente
- Ler qualquer arquivo do repo
- Criar/editar componentes, telas, hooks
- Atualizar documentação local
- Criar branches de feature

### Deve perguntar antes
- Adicionar dependências nativas (que exigem rebuild)
- Mudanças em `app.json` (afeta build e stores)
- Mudanças de navegação estrutural

### Nunca fazer
- Commitar direto em `master`
- Expor secrets ou chaves de API em código

## Integração com platform

Este repo é orchestrado por `auraxis-platform`.
Handoffs e decisões de arquitetura ficam em `auraxis-platform/.context/`.
Contratos de API são definidos em `auraxis-api`.
