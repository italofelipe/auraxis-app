# Sharing outgoing mobile parity

## Goal

Pair the App with the Web sharing outgoing flow tracked by issue #499: users must be able to create invitations, see invitations they sent, and revoke pending sent invitations from the mobile shared entries surface.

## Constraints

- Keep the existing `/shared-entries/*` app API contract; do not add backend or database changes.
- Extend PR #641 because it is already the active shared-entries parity PR.
- Keep the diff focused on `features/shared-entries`, docs and tests.
- Preserve the current incoming invitation accept/reject flow.

## Plan

1. Add RED coverage for separating incoming pending invitations from invitations sent by the current user.
2. Add RED controller coverage for creating an outgoing invitation and revoking a sent invitation.
3. Add RED screen coverage for the `Compartilhei` tab composer and outgoing invitations list.
4. Implement classifier helpers, controller form state/handlers and the mobile UI.
5. Update architecture/dataflow docs and run targeted tests, then the full app quality gate.
