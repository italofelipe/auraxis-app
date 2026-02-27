## Summary

<!-- What changed and why -->

## Task Reference

- Task ID: `APPx` / `PLTx` / `Bxx` (if integration)
- Backlog updated in `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-app/tasks.md`: [ ] yes

## Validation

- [ ] `npm run quality-check`
- [ ] `npm run contracts:check`
- [ ] `npm run test:coverage`

## Frontend Governance (Mandatory)

- [ ] No `.js/.jsx` introduced in product code.
- [ ] All styling uses tokens/theme (no arbitrary literals).
- [ ] Reusable code moved to `shared/*`.
- [ ] React Native Paper-first approach respected (wrappers/components before raw primitives).

## Contract Integration (Mandatory when backend contract changed)

- [ ] Read `Feature Contract Pack` (`.context/feature_contracts/<TASK_ID>.md`).
- [ ] Updated `contracts/feature-contract-baseline.json` (if new/changed pack).
- [ ] Regenerated OpenAPI types (`npm run contracts:sync`) and reviewed diff.

## Risks / Follow-ups

<!-- Residual risk, technical debt, and next action -->
