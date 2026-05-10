## Descrição

<!-- Explique o que foi implementado e por quê. -->

Closes #<!-- número da issue -->

## Tipo de mudança

- [ ] Feature nova
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentação / infraestrutura
- [ ] Outros: ___

## Checklist de qualidade

- [ ] `npm run quality-check` passou localmente
- [ ] Coverage **não** regrediu abaixo de 85%
- [ ] Testes unitários criados/atualizados para o código novo
- [ ] Screen controllers e services têm teste escrito (TDD)

## Checklist de dependências nativas

- [ ] **Não adicionei dependência nativa** — OU —
- [ ] Adicionei dependência nativa via `npx expo install <dep>` (não npm install) E documentei a necessidade de novo build nativo no corpo do PR

## Checklist de feature flags

- [ ] **Não criei feature nova** — OU —
- [ ] Feature nova está atrás de flag em `shared/feature-flags/` e `config/feature-flags.json`

## Checklist de contratos

- [ ] Nenhum endpoint novo consumido — OU —
- [ ] `npm run contracts:check` passou com o novo endpoint

## Screenshots / evidência (se UI)

<!-- Screenshot ou vídeo da mudança visual — obrigatório para mudanças de tela -->
