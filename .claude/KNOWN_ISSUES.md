# Known Issues — auraxis-app

Armadilhas documentadas. Consulte antes de abrir PR.

---

## Native Dependencies Gotchas

### Adicionar dependência nativa com `npm install`

**Sintoma:** Módulo funciona em dev mas falha no build ou no dispositivo físico.

**Causa:** Dependências com código nativo (Swift/Kotlin) precisam de `expo install` para garantir versão compatível com o SDK atual (54).

**Solução:**
```bash
npx expo install <package-name>   # correto
npm install <package-name>        # errado para deps nativas
```

Após adicionar dep nativa: informar que novo build é necessário (`eas build --profile development`).

### Modificar `app.json` sem aprovação

**Sintoma:** Mudanças em bundle ID, permissões ou scheme de deep link afetam o build nas stores.

**Solução:** Sempre perguntar antes de modificar `app.json`. Nunca alterar autonomamente.

---

## Feature Flags Gotchas

### Feature nova sem flag

**Sintoma:** Feature parcialmente implementada aparece em produção para todos os usuários.

**Causa:** Agente implementou a feature mas esqueceu de colocá-la atrás de flag.

**Solução:** Toda feature nova deve:
1. Ter entrada em `config/feature-flags.json` com `enabled: false` por padrão
2. Ter entrada em `shared/feature-flags/` com hook `useFeatureFlag('nome-da-flag')`
3. Wrap da tela/componente com verificação de flag

---

## Contract Gotchas

### Implementar contra endpoint não documentado

**Sintoma:** `npm run contracts:check` falha — endpoint não está no snapshot OpenAPI.

**Solução:**
1. Verificar se o endpoint existe em `auraxis-api` antes de consumir
2. Pegar snapshot atualizado: `npm run contracts:sync`
3. Se endpoint não existe na API: criar issue no `auraxis-api` primeiro

---

## CI Gotchas

### `git add .` ou `git add -A`

**Sintoma:** Hook bloqueia com "BLOQUEADO: git add . é proibido."

**Solução:** Stage seletivo sempre:
```bash
git add features/transactions/hooks/use-transaction-query.ts
git add features/transactions/hooks/use-transaction-query.spec.ts
```

---

## Referência rápida

| Problema | Solução |
|----------|---------|
| Dep nativa não funciona | Usar npx expo install, não npm install |
| Feature em produção sem querer | Criar feature flag antes de implementar |
| contracts:check falha | Verificar endpoint no auraxis-api primeiro |
| git add . bloqueado | git add <arquivo-específico> |
| app.json modificado | Sempre pedir aprovação humana antes |
