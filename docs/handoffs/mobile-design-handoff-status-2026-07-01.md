# Mobile Design Handoff Status — 2026-07-01

This note records the app-side status of the recent mobile design handoffs after
the web-to-app parity work merged.

## Summary

| Handoff | App status | Evidence |
| --- | --- | --- |
| Web/App parity tools + login base | Implemented | PR #629 |
| Bottom tab liquida | Implemented | PR #635 |
| Transaction observations | Implemented | PR #637 |
| Login mobile premium hardening | In progress | Issue #638 |

## Implemented

- `design_handoff_menu_mobile_auraxis` is represented in the app by the custom
  `AppTabBar`, the five-tab private navigation map and the `Mais` hub.
- `design_handoff_transacoes_coluna_observacoes` is represented on mobile by
  first-class transaction `observation` support in the form, controller payloads,
  duplicate flow, feed card and action sheet.
- The premium login surface from `design_handoff_login_mobile_auraxis` is already
  represented by the brand gradient shell, glass fields, CTA, legal links,
  session-expired notice and preserved auth controller flow.

## Current Slice

Issue #638 closes the remaining login handoff hardening items:

- move the remaining premium login placeholders into i18n;
- make the glass input focus state explicit and covered by tests;
- keep the auth flow, captcha, legal links and session-expired behavior unchanged.

## Non-goals

- No backend, database, OpenAPI, `app.json`, `eas.json` or environment changes.
- No rewrite of the login screen or bottom tab.
- No new feature flag; this is hardening of an already shipped surface.
