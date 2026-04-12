## Auraxis App

### Stack:

- React Native
- Expo
- TypeScript
- Tamagui
- TanStack Query
- ESLint

### Fundação atual

- runtime mobile padronizado em Tamagui via `core/providers/app-providers.tsx`
- tema Auraxis em `config/tamagui-theme.ts`
- wrappers compartilhados em `shared/components/*`

### Runtime local

```bash
nvm use 24
```

- `Node 24 LTS` é a baseline canônica do repo.
- CI e `npm run ci:local` leem a versão a partir de `.nvmrc`.

### Validação antes de commit

```bash
npm run quality-check
npm run ci:local
```
