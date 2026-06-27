# Credit card expense actions

## Overview

The mobile credit card bill can manage bill expenses directly from the invoice
item list. A card expense is the same backend `transactions` record with
`creditCardId` filled; the app must not create a separate expense entity for the
Cards domain.

## Runtime flag

- Key: `app.credit-cards.expense-actions`
- Catalog: `config/feature-flags.json`
- Initial status: `enabled-dev`

When the flag is disabled by the runtime provider, invoice items render as a
read-only list. When enabled, each item exposes edit, duplicate and remove
actions plus the "Também em Transações" sync chip.

## Behavior

- Edit opens the shared expense sheet in `edit` mode, hydrated from the original
  `TransactionRecord`.
- Create keeps the previous "Lancar despesa" flow and supports installments and
  down payment.
- Edit hides create-only installment controls and updates the existing
  transaction through `useUpdateTransactionMutation`.
- Duplicate creates a simple pending transaction copy with the same date, card,
  category, account, description and currency, plus the title suffix
  ` (cópia)`. Recurrence and installment flags are intentionally not copied.
- Remove confirms the action and deletes the occurrence from `transactions`,
  making it disappear from both Cards and Transactions.

After create, edit, duplicate or remove, invalidate `transactions`,
`credit-cards` and `dashboard` query roots so bill totals, feeds and dashboard
summaries converge without requiring an app restart.

## Validation

Focused coverage lives in:

- `stores/expense-sheet-store.test.ts`
- `features/credit-cards/hooks/use-expense-form.test.tsx`
- `features/credit-cards/components/expense-sheet/expense-sheet.test.tsx`
- `features/credit-cards/components/invoice-grouped-items.test.tsx`
- `features/credit-cards/hooks/use-credit-card-bill-screen-controller.test.tsx`
- `features/credit-cards/screens/credit-card-bill-screen.test.tsx`

Run `npm run quality-check` before release.
