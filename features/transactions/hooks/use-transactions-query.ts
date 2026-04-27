import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  DeletedTransactionListResponse,
  TransactionCollection,
  TransactionListQuery,
  TransactionRecord,
  TransactionSummary,
  TransactionSummaryQuery,
} from "@/features/transactions/contracts";
import { transactionsService } from "@/features/transactions/services/transactions-service";

export const useTransactionsQuery = (query: TransactionListQuery = {}) => {
  return createApiQuery<TransactionCollection>(
    [...queryKeys.transactions.list(), query],
    () => transactionsService.listTransactions(query),
  );
};

export const useTransactionDetailQuery = (
  transactionId: string | null,
  enabled = true,
) => {
  return createApiQuery<TransactionRecord>(
    [...queryKeys.transactions.detail(transactionId ?? "unknown"), enabled],
    () => transactionsService.getTransaction(transactionId ?? ""),
    {
      enabled: enabled && Boolean(transactionId),
    },
  );
};

export const useTransactionSummaryQuery = (query: TransactionSummaryQuery) => {
  return createApiQuery<TransactionSummary>(
    [...queryKeys.transactions.summary(), query],
    () => transactionsService.getSummary(query),
  );
};

export const useDeletedTransactionsQuery = () => {
  return createApiQuery<DeletedTransactionListResponse>(
    queryKeys.transactions.deleted(),
    () => transactionsService.listDeleted(),
  );
};
