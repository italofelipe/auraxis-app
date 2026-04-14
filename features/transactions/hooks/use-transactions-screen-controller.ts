import { useMemo } from "react";

import type { TransactionRecord } from "@/features/transactions/contracts";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";

export interface TransactionViewModel {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: "income" | "expense";
  readonly dueDate: string;
  readonly status: string;
  readonly isRecurring: boolean;
}

export interface TransactionsScreenController {
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
  readonly transactions: TransactionViewModel[];
  readonly total: number;
}

const toTransactionViewModel = (tx: TransactionRecord): TransactionViewModel => ({
  id: tx.id,
  title: tx.title,
  amount: tx.amount,
  type: tx.type,
  dueDate: tx.dueDate,
  status: tx.status,
  isRecurring: tx.isRecurring,
});

/**
 * Creates the canonical controller for the transactions screen.
 *
 * @returns Normalized transaction list and pagination metadata.
 */
export function useTransactionsScreenController(): TransactionsScreenController {
  const transactionsQuery = useTransactionsQuery();

  const transactions = useMemo<TransactionViewModel[]>(
    () => (transactionsQuery.data?.transactions ?? []).map(toTransactionViewModel),
    [transactionsQuery.data],
  );

  return {
    transactionsQuery,
    transactions,
    total: transactionsQuery.data?.pagination.total ?? 0,
  };
}
