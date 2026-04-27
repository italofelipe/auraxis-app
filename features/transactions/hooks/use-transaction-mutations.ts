import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateTransactionCommand,
  TransactionRecord,
  UpdateTransactionCommand,
} from "@/features/transactions/contracts";
import { transactionsService } from "@/features/transactions/services/transactions-service";

export const useCreateTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<TransactionRecord, Error, CreateTransactionCommand>({
    mutationFn: (command) => transactionsService.createTransaction(command),
    onSuccess: async () => {
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

export const useDeleteTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (transactionId) => transactionsService.deleteTransaction(transactionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
    },
  });
};

export const useRestoreTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<TransactionRecord, Error, string>({
    mutationFn: (transactionId) =>
      transactionsService.restoreTransaction(transactionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
    },
  });
};
