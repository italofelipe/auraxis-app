import { useState } from "react";

import type { DeletedTransactionRecord } from "@/features/transactions/contracts";
import { useRestoreTransactionMutation } from "@/features/transactions/hooks/use-transaction-mutations";
import { useDeletedTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";

export interface TransactionsTrashScreenController {
  readonly deletedQuery: ReturnType<typeof useDeletedTransactionsQuery>;
  readonly transactions: readonly DeletedTransactionRecord[];
  readonly restoringTransactionId: string | null;
  readonly restoreError: unknown | null;
  readonly handleRestore: (transactionId: string) => Promise<void>;
  readonly dismissRestoreError: () => void;
}

export function useTransactionsTrashScreenController(): TransactionsTrashScreenController {
  const deletedQuery = useDeletedTransactionsQuery();
  const restoreMutation = useRestoreTransactionMutation();
  const [restoringTransactionId, setRestoringTransactionId] = useState<
    string | null
  >(null);
  const [restoreError, setRestoreError] = useState<unknown | null>(null);

  const handleRestore = async (transactionId: string): Promise<void> => {
    setRestoringTransactionId(transactionId);
    setRestoreError(null);
    try {
      await restoreMutation.mutateAsync(transactionId);
    } catch (error) {
      setRestoreError(error);
    } finally {
      setRestoringTransactionId(null);
    }
  };

  return {
    deletedQuery,
    transactions: deletedQuery.data?.transactions ?? [],
    restoringTransactionId,
    restoreError,
    handleRestore,
    dismissRestoreError: () => {
      setRestoreError(null);
      restoreMutation.reset();
    },
  };
}
