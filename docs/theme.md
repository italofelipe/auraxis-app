# Auraxis App Theme

## Source of truth

The mobile theme follows the Auraxis DS v3 "Market Pulse" contract:

- `auraxis-platform/.context/61_design_source_of_truth.md`
- `auraxis-platform/docs/wiki/MVP-1-Web-Design-System-v3-Market-Pulse.md`
- `auraxis-platform/designs/web/revamp/tokens/auraxis-ds-v3.tokens.json`
- `auraxis-platform/designs/web/revamp/tokens/auraxis-ds-v3.tokens.css`

The deprecated orange/brown palette must not be used for new UI work.

## Runtime behavior

- New users default to `system`, and unresolved system color schemes fall back to `auraxis_light`.
- `auraxis` is an alias of `auraxis_light`.
- `auraxis_dark` preserves the DS v3 dark Market Pulse palette.
- `auraxis_light` keeps the DS v3 cyan/violet/lime/red accents and uses native high-contrast light surfaces.
- The profile Appearance section persists `system`, `light`, and `dark` in `AppShellStore`.
- Appearance in Settings/Profile is the only place allowed to change theme.
  Product screens, heroes and tours must not expose local theme shortcuts.

## Surface language

`AppSurfaceCard` is the single semantic content surface:

| Variant | Radius | Border | Depth | Use |
|---|---:|---|---|---|
| `flat` (default) | 14 px | hairline semantic | none | content cards and grouped information |
| `raised` | 14 px | hairline semantic | y 1, opacity 0.08, blur 4, elevation 1 | deliberately emphasized content |
| `overlay` | top 24 px | hairline semantic | short overlay token | sheets and transient overlays |

Pills and chips keep a fully rounded shape because they are controls, not
containers. Custom white/light content boxes must be migrated to semantic
surface tokens; direct `shadow*`/`elevation` declarations are forbidden outside
the structural allowlist.

`npm run governance:all` runs
`scripts/check-visual-surface-governance.cjs` and rejects new direct depth in
feature/content components.

## Native differences

DS v3 is dark-first on web. The app keeps the visual language but adapts where native readability requires it:

- light mode uses white and blue-grey surfaces instead of dark navy fills;
- status bar is automatic so iOS/Android choose readable glyphs per active surface;
- React Navigation tab colors consume resolved semantic tokens instead of raw Tamagui variables;
- typography still uses the bundled native fonts until a separate font migration replaces the current Expo font setup.

## Core Screen Review Checklist

Use this checklist before merging theme-impacting changes:

- Dashboard: cards, quick-add FAB, weekly insight badge, loading skeleton.
- Transactions: list rows, calendar markers, form fields, trash screen, import entry point.
- Goals: cards, completed state, simulator and scenario screens.
- Wallet: summary cards, ticker detail, charts, operation history.
- Tools: tools hub, calculator forms, result cards, simulation history.
- Auth: login, register, forgot/reset password, confirm email, Turnstile challenge.
- Settings/Profile: appearance, language, security, notifications, danger zone, privacy center.

For each screen, verify both `auraxis_light` and `auraxis_dark` for:

- text contrast;
- empty/loading/error/success states;
- button foreground and background;
- input background, border, placeholder, and error colors;
- tab and icon active/inactive states;
- no overlapped text on small screens.
- content cards remain visually flat and do not accumulate nested shadows;
- danger badges/buttons use a high-contrast semantic foreground.
