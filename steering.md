# steering.md — auraxis-app

## Princípios técnicos

- **TypeScript strict** em todo o código.
- **Expo Router** como solução de navegação (file-based).
- **Sem lógica de negócio no frontend** — toda regra fica em auraxis-api.
- **Contratos de API**: consumir apenas endpoints documentados e versionados em auraxis-api.
- **Testes**: Vitest + React Native Testing Library (a implementar).

## Convenções de código

- Componentes em `components/` são genéricos e reutilizáveis.
- Telas ficam em `app/` seguindo a convenção do Expo Router.
- Hooks customizados em `hooks/`.
- Constantes e temas em `constants/`.

## Integrações externas

- **auraxis-api**: única fonte de verdade para dados.
- **Expo EAS Build**: pipeline de build mobile (a configurar).
- **Expo EAS Update**: OTA updates (a configurar).

## Segurança

- Nunca armazenar tokens em `AsyncStorage` sem criptografia.
- Usar `expo-secure-store` para dados sensíveis.
- Nunca expor chaves de API ou tokens no código.

## Referências

- Governança global: `auraxis-platform/.context/07_steering_global.md`
- Contrato de agente: `auraxis-platform/.context/08_agent_contract.md`
