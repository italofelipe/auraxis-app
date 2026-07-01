# Transaction Observations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class mobile support for transaction observations while preserving existing transaction descriptions.

**Architecture:** The app already maps `observation` in the API service and domain contract. This slice extends the form schema/controller payload, feed view-model, transaction card and action sheet so `observation` can be edited and displayed without backend changes.

**Tech Stack:** Expo Router, React Native, Tamagui, React Hook Form, Zod, Jest, Testing Library React Native.

---

### Task 1: Form And Controller Payload

**Files:**
- Modify: `features/transactions/validators.ts`
- Modify: `features/transactions/components/transaction-form.tsx`
- Modify: `features/transactions/components/transaction-form.test.tsx`
- Modify: `features/transactions/hooks/use-transactions-screen-controller.ts`
- Modify: `features/transactions/hooks/use-transactions-screen-controller.test.ts`

- [ ] Write failing tests asserting that form values include optional `observation`, edit mode pre-fills it, create/update payloads send it, and duplicate preserves it.
- [ ] Run focused tests and confirm failures mention missing `observation`.
- [ ] Add `observation` to create/update schemas, form defaults, edit defaults and submit payloads.
- [ ] Add an `Observações (opcional)` input using the same field pattern as `Descrição`.
- [ ] Re-run focused tests and confirm they pass.

### Task 2: Feed View-Model And Components

**Files:**
- Modify: `features/transactions/model/transactions-feed.ts`
- Modify: `features/transactions/model/transactions-feed.test.ts`
- Modify: `features/transactions/components/tx-card-body.tsx`
- Modify: `features/transactions/components/tx-components.test.tsx`
- Modify: `features/transactions/components/transaction-action-sheet.tsx`
- Modify: `features/transactions/components/transaction-action-sheet.test.tsx`

- [ ] Write failing tests asserting that `toFeedItem` exposes `observation`, `TxCard` renders it when present, and `TransactionActionSheet` shows description and observation separately.
- [ ] Run focused tests and confirm failures mention missing observation rendering.
- [ ] Add `observation` to `TransactionFeedItem` and map it from `TransactionRecord`.
- [ ] Render observation with a compact "Observações" label in card/action sheet while keeping legacy description visible.
- [ ] Re-run focused tests and confirm they pass.

### Task 3: Documentation And Gates

**Files:**
- Modify: `ARCHITECTURE.md`
- Modify: `DATAFLOW.md`

- [ ] Document the mobile transaction observation flow and state that no backend contract change is introduced.
- [ ] Run focused transaction tests.
- [ ] Run `npm run quality-check`.
- [ ] Review `git diff --stat` and prepare a scoped commit.
