import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { TransactionAnalyticsProperties } from "@/core/observability/analytics-types";
import { useAnalytics } from "@/core/observability/use-analytics";
import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateTransactionCommand,
  TransactionCollection,
  TransactionDeleteScope,
  TransactionRecord,
  UpdateTransactionCommand,
} from "@/features/transactions/contracts";
import { transactionsService } from "@/features/transactions/services/transactions-service";

interface DeleteTransactionMutationContext {
  readonly transaction?: TransactionRecord;
}

const toTransactionAnalyticsProperties = (
  transaction: TransactionRecord,
): TransactionAnalyticsProperties => ({
  transactionType: transaction.type,
  source: transaction.source || "unknown",
  status: transaction.status,
  isRecurring: transaction.isRecurring,
  isInstallment: transaction.isInstallment,
  currency: transaction.currency,
});

const findCachedTransaction = (
  queryClient: QueryClient,
  transactionId: string,
): TransactionRecord | undefined => {
  const transactionCollections =
    queryClient.getQueriesData<TransactionCollection>({
      queryKey: queryKeys.transactions.list(),
    });

  for (const [, collection] of transactionCollections) {
    const transaction = collection?.transactions.find(
      (item) => item.id === transactionId,
    );
    if (transaction) {
      return transaction;
    }
  }

  return undefined;
};

export const useCreateTransactionMutation = () => {
  const analytics = useAnalytics();
  const queryClient = useQueryClient();

  return useMutation<TransactionRecord, Error, CreateTransactionCommand>({
    mutationFn: (command) => transactionsService.createTransaction(command),
    onSuccess: async (transaction) => {
      if (transaction) {
        analytics.capture(
          "transaction.created",
          toTransactionAnalyticsProperties(transaction),
        );
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
    },
  });
};

export interface UpdateTransactionVariables {
  readonly transactionId: string;
  readonly payload: UpdateTransactionCommand;
}

export const useUpdateTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<TransactionRecord, Error, UpdateTransactionVariables>({
    mutationFn: ({ transactionId, payload }) => {
      return transactionsService.updateTransaction(transactionId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
    },
  });
};

export interface DeleteTransactionVariables {
  readonly transactionId: string;
  /** "series" soft-deletes the whole recurring/installment series. */
  readonly scope?: TransactionDeleteScope;
}

export const useDeleteTransactionMutation = () => {
  const analytics = useAnalytics();
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    DeleteTransactionVariables,
    DeleteTransactionMutationContext
  >({
    mutationFn: ({ transactionId, scope }) =>
      transactionsService.deleteTransaction(transactionId, scope ?? "occurrence"),
    onMutate: ({ transactionId }) => ({
      transaction: findCachedTransaction(queryClient, transactionId),
    }),
    onSuccess: async (_data, _variables, mutationContext) => {
      if (mutationContext?.transaction) {
        analytics.capture(
          "transaction.deleted",
          toTransactionAnalyticsProperties(mutationContext.transaction),
        );
      } else {
        analytics.capture("transaction.deleted");
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
    },
  });
};

export interface MarkTransactionPaidVariables {
  readonly transactionId: string;
  /** Effective payment date in YYYY-MM-DD format. */
  readonly paidAt: string;
}

export const useMarkTransactionPaidMutation = () => {
  const analytics = useAnalytics();
  const queryClient = useQueryClient();

  return useMutation<TransactionRecord, Error, MarkTransactionPaidVariables>({
    mutationFn: ({ transactionId, paidAt }) =>
      transactionsService.markTransactionPaid(transactionId, paidAt),
    onSuccess: async (transaction) => {
      if (transaction) {
        analytics.capture(
          "transaction.paid",
          toTransactionAnalyticsProperties(transaction),
        );
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
    },
  });
};

export const useRestoreTransactionMutation = () => {
  const analytics = useAnalytics();
  const queryClient = useQueryClient();

  return useMutation<TransactionRecord, Error, string>({
    mutationFn: (transactionId) =>
      transactionsService.restoreTransaction(transactionId),
    onSuccess: async (transaction) => {
      if (transaction) {
        analytics.capture(
          "transaction.restored",
          toTransactionAnalyticsProperties(transaction),
        );
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
    },
  });
};
