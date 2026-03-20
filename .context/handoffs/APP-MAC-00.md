# APP-MAC-00 — Fundação visual e runtime Tamagui

## O que foi feito

- ativado o `TamaguiProvider` no runtime em `components/providers/app-providers.tsx`
- criado o tema Auraxis em `config/tamagui-theme.ts`
- adicionados wrappers compartilhados em `shared/components/`
- migrado `components/ui/screen-container.tsx` para reusar `AppScreen`
- aplicada a fundação nova em telas reais:
  - `app/index.tsx`
  - `app/(private)/ferramentas.tsx`
- atualizado o steering local e o README do app para refletir Tamagui como stack oficial

## O que foi validado

- `npm run lint`
- `npm run typecheck`
- `npm run policy:check`
- `npm run contracts:check`
- `npm run quality-check`

## Riscos pendentes

- outras telas privadas ainda usam a base legada e devem migrar gradualmente para os wrappers Tamagui
- ainda falta expandir a fundação para navegação, formulários complexos e estados premium/logados do fluxo `J15`

## Próximo passo sugerido

- abrir o próximo slice visual sobre esta base:
  - `J15-4` no app
  - ou continuar a adoção transversal de Tamagui em dashboard/carteira para reduzir drift interno
