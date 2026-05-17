import { useMemo, useState } from "react";

import type { TransactionRecord } from "@/features/transactions/contracts";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import {
  normalizeAmount,
  type CreateTransactionFormValues,
} from "@/features/transactions/validators";

export type TransactionsTypeFilter = "all" | "income" | "expense";
export type TransactionsViewMode = "list" | "calendar";

export type TransactionFormMode =
  | { readonly kind: "closed" }
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly transaction: TransactionRecord };

export interface TransactionViewModel {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: "income" | "expense";
  readonly dueDate: string;
  readonly status: string;
  readonly isRecurring: boolean;
  readonly isInstallment: boolean;
  readonly installmentCount: number | null;
  readonly installmentGroupId: string | null;
  readonly installmentNumber: number | null;
}

export interface TransactionsScreenController {
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
  readonly transactions: readonly TransactionViewModel[];
  readonly total: number;
  readonly typeFilter: TransactionsTypeFilter;
  readonly setTypeFilter: (filter: TransactionsTypeFilter) => void;
  readonly installmentGroupFilter: string | null;
  readonly viewMode: TransactionsViewMode;
  readonly setViewMode: (mode: TransactionsViewMode) => void;
  readonly formMode: TransactionFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingTransactionId: string | null;
  readonly duplicatingTransactionId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleOpenEdit: (transaction: TransactionRecord) => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateTransactionFormValues) => Promise<void>;
  readonly handleDelete: (transactionId: string) => Promise<void>;
  readonly handleDuplicate: (transactionId: string) => Promise<void>;
  readonly handleShowInstallmentGroup: (installmentGroupId: string) => void;
  readonly handleClearInstallmentGroupFilter: () => void;
  readonly dismissSubmitError: () => void;
}

const toViewModel = (
  record: TransactionRecord,
  installmentNumber: number | null,
): TransactionViewModel => ({
  id: record.id,
  title: record.title,
  amount: record.amount,
  type: record.type,
  dueDate: record.dueDate,
  status: record.status,
  isRecurring: record.isRecurring,
  isInstallment: record.isInstallment,
  installmentCount: record.installmentCount,
  installmentGroupId: record.installmentGroupId,
  installmentNumber,
});

const matchesFilter = (
  type: TransactionRecord["type"],
  filter: TransactionsTypeFilter,
): boolean => {
  if (filter === "all") {
    return true;
  }
  return type === filter;
};

const buildInstallmentNumberMap = (
  records: readonly TransactionRecord[],
): ReadonlyMap<string, number> => {
  const groups = new Map<string, TransactionRecord[]>();
  records.forEach((record) => {
    if (!record.isInstallment || !record.installmentGroupId) {
      return;
    }
    const group = groups.get(record.installmentGroupId) ?? [];
    group.push(record);
    groups.set(record.installmentGroupId, group);
  });

  const installmentNumbers = new Map<string, number>();
  groups.forEach((group) => {
    group
      .sort((a, b) => {
        const dateComparison = a.dueDate.localeCompare(b.dueDate);
        return dateComparison === 0 ? a.id.localeCompare(b.id) : dateComparison;
      })
      .forEach((record, index) => {
        installmentNumbers.set(record.id, index + 1);
      });
  });

  return installmentNumbers;
};

const buildSubmitPayload = (values: CreateTransactionFormValues) => ({
  title: values.title,
  amount: normalizeAmount(values.amount),
  type: values.type,
  dueDate: values.dueDate,
  description: values.description,
  isRecurring: values.isRecurring ?? false,
  creditCardId: values.type === "expense" ? values.creditCardId : null,
  isInstallment:
    values.type === "expense" && values.creditCardId ? values.isInstallment : false,
  installmentCount:
    values.type === "expense" && values.creditCardId && values.isInstallment
      ? values.installmentCount
      : null,
});

/**
 * Canonical controller for the transactions screen. Owns the create/edit
 * form state machine, the per-transaction delete tracker, the type filter
 * and the three mutations. The screen remains view-only.
 */
// eslint-disable-next-line max-lines-per-function
export function useTransactionsScreenController(): TransactionsScreenController {
  const transactionsQuery = useTransactionsQuery();
  const createMutation = useCreateTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();
  const deleteMutation = useDeleteTransactionMutation();
  const [formMode, setFormMode] = useState<TransactionFormMode>({ kind: "closed" });
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [duplicatingTransactionId, setDuplicatingTransactionId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionsTypeFilter>("all");
  const [viewMode, setViewMode] = useState<TransactionsViewMode>("list");
  const [installmentGroupFilter, setInstallmentGroupFilter] = useState<string | null>(null);

  const transactions = useMemo<readonly TransactionViewModel[]>(() => {
    const records = transactionsQuery.data?.transactions ?? [];
    const installmentNumbers = buildInstallmentNumberMap(records);
    return records
      .filter((record) => matchesFilter(record.type, typeFilter))
      .filter((record) =>
        installmentGroupFilter ? record.installmentGroupId === installmentGroupFilter : true,
      )
      .map((record) => toViewModel(record, installmentNumbers.get(record.id) ?? null));
  }, [installmentGroupFilter, transactionsQuery.data, typeFilter]);

  const handleSubmit = async (values: CreateTransactionFormValues): Promise<void> => {
    setSubmitError(null);
    const payload = buildSubmitPayload(values);
    try {
      if (formMode.kind === "edit") {
        await updateMutation.mutateAsync({
          transactionId: formMode.transaction.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setFormMode({ kind: "closed" });
    } catch (error) {
      setSubmitError(error);
    }
  };

  const handleDelete = async (transactionId: string): Promise<void> => {
    setDeletingTransactionId(transactionId);
    try {
      await deleteMutation.mutateAsync(transactionId);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const handleDuplicate = async (transactionId: string): Promise<void> => {
    const original = transactionsQuery.data?.transactions.find(
      (item) => item.id === transactionId,
    );
    if (!original) {
      return;
    }
    setDuplicatingTransactionId(transactionId);
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        title: original.title,
        amount: original.amount,
        type: original.type,
        // Date the copy with today so the user can spot it immediately
        // and so the duplicate doesn't land in the past by surprise.
        dueDate: new Date().toISOString().slice(0, 10),
        description: original.description ?? null,
        isRecurring: original.isRecurring,
        creditCardId: original.type === "expense" ? original.creditCardId : null,
        isInstallment: false,
        installmentCount: null,
      });
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDuplicatingTransactionId(null);
    }
  };

  return {
    transactionsQuery,
    transactions,
    total: transactionsQuery.data?.pagination.total ?? 0,
    typeFilter,
    setTypeFilter,
    installmentGroupFilter,
    viewMode,
    setViewMode,
    formMode,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
    deletingTransactionId,
    duplicatingTransactionId,
    handleOpenCreate: () => {
      setSubmitError(null);
      setFormMode({ kind: "create" });
    },
    handleOpenEdit: (transaction) => {
      setSubmitError(null);
      setFormMode({ kind: "edit", transaction });
    },
    handleCloseForm: () => {
      setSubmitError(null);
      setFormMode({ kind: "closed" });
    },
    handleSubmit,
    handleDelete,
    handleDuplicate,
    handleShowInstallmentGroup: (installmentGroupId) => {
      setInstallmentGroupFilter(installmentGroupId);
      setTypeFilter("expense");
    },
    handleClearInstallmentGroupFilter: () => {
      setInstallmentGroupFilter(null);
    },
    dismissSubmitError: () => {
      setSubmitError(null);
      createMutation.reset();
      updateMutation.reset();
    },
  };
}
