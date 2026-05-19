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
