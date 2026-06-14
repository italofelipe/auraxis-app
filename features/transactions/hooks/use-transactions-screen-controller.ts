import { useEffect, useMemo, useRef, useState } from "react";

import { useLocalSearchParams } from "expo-router";

import type {
  TransactionDeleteScope,
  TransactionListQuery,
  TransactionRecord,
  TransactionStatus,
} from "@/features/transactions/contracts";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useMarkTransactionPaidMutation,
  useUpdateTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import {
  normalizeAmount,
  type CreateTransactionFormValues,
} from "@/features/transactions/validators";

export type TransactionsTypeFilter = "all" | "income" | "expense";
export type TransactionsStatusFilter = "all" | TransactionStatus;
export type TransactionsTagFilter = "all" | string;
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
  readonly description: string | null;
  readonly isRecurring: boolean;
  readonly isInstallment: boolean;
  readonly installmentCount: number | null;
  readonly installmentGroupId: string | null;
  readonly installmentNumber: number | null;
}

interface SelectedMonth {
  readonly year: number;
  readonly month: number;
}

export interface TransactionsScreenController {
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
  readonly transactions: readonly TransactionViewModel[];
  readonly total: number;
  /** Net do período carregado (receitas − despesas, ignora canceladas). */
  readonly monthBalance: number;
  /** True quando algum filtro de tipo/status/tag está ativo. */
  readonly hasActiveFilters: boolean;
  readonly typeFilter: TransactionsTypeFilter;
  readonly setTypeFilter: (filter: TransactionsTypeFilter) => void;
  readonly statusFilter: TransactionsStatusFilter;
  readonly setStatusFilter: (filter: TransactionsStatusFilter) => void;
  readonly tagFilter: TransactionsTagFilter;
  readonly setTagFilter: (filter: TransactionsTagFilter) => void;
  readonly periodLabel: string;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly resetToCurrentMonth: () => void;
  readonly clearFilters: () => void;
  readonly installmentGroupFilter: string | null;
  readonly viewMode: TransactionsViewMode;
  readonly setViewMode: (mode: TransactionsViewMode) => void;
  readonly formMode: TransactionFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingTransactionId: string | null;
  readonly duplicatingTransactionId: string | null;
  readonly payingTransactionId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleOpenEdit: (transaction: TransactionRecord) => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateTransactionFormValues) => Promise<void>;
  readonly handleDelete: (
    transactionId: string,
    scope?: TransactionDeleteScope,
  ) => Promise<void>;
  readonly handleMarkPaid: (transactionId: string, paidAt: string) => Promise<void>;
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
  description: record.description,
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

const currentMonth = (): SelectedMonth => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
};

const shiftMonth = (selected: SelectedMonth, delta: number): SelectedMonth => {
  const date = new Date(selected.year, selected.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const monthStartIso = (selected: SelectedMonth): string =>
  toIsoDate(new Date(selected.year, selected.month, 1));

const monthEndIso = (selected: SelectedMonth): string =>
  toIsoDate(new Date(selected.year, selected.month + 1, 0));

const formatMonthLabel = (selected: SelectedMonth): string => {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(selected.year, selected.month, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

interface ListQueryInputs {
  readonly typeFilter: TransactionsTypeFilter;
  readonly statusFilter: TransactionsStatusFilter;
  readonly tagFilter: TransactionsTagFilter;
  readonly selectedMonth: SelectedMonth;
}

/**
 * Builds the server-side list query from the active UI filters. Mirrors the
 * web behaviour: "all" filters are omitted and the month range is always
 * sent as start/end dates.
 */
const buildListQuery = ({
  typeFilter,
  statusFilter,
  tagFilter,
  selectedMonth,
}: ListQueryInputs): TransactionListQuery => ({
  ...(typeFilter !== "all" ? { type: typeFilter } : {}),
  ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  ...(tagFilter !== "all" ? { tagId: tagFilter } : {}),
  startDate: monthStartIso(selectedMonth),
  endDate: monthEndIso(selectedMonth),
});

interface TransactionsFiltersState {
  readonly typeFilter: TransactionsTypeFilter;
  readonly setTypeFilter: (filter: TransactionsTypeFilter) => void;
  readonly statusFilter: TransactionsStatusFilter;
  readonly setStatusFilter: (filter: TransactionsStatusFilter) => void;
  readonly tagFilter: TransactionsTagFilter;
  readonly setTagFilter: (filter: TransactionsTagFilter) => void;
  readonly periodLabel: string;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly resetToCurrentMonth: () => void;
  readonly clearFilters: () => void;
  readonly listQuery: TransactionListQuery;
}

/**
 * Owns the server-side filter state (type, status, tag and monthly period)
 * and derives the list query sent to the API.
 */
function useTransactionsFilters(): TransactionsFiltersState {
  const [typeFilter, setTypeFilter] = useState<TransactionsTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TransactionsStatusFilter>("all");
  const [tagFilter, setTagFilter] = useState<TransactionsTagFilter>("all");
  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth>(currentMonth);
  const listQuery = useMemo(
    () => buildListQuery({ typeFilter, statusFilter, tagFilter, selectedMonth }),
    [typeFilter, statusFilter, tagFilter, selectedMonth],
  );

  return {
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    tagFilter,
    setTagFilter,
    periodLabel: formatMonthLabel(selectedMonth),
    goToPreviousMonth: () => setSelectedMonth((current) => shiftMonth(current, -1)),
    goToNextMonth: () => setSelectedMonth((current) => shiftMonth(current, 1)),
    resetToCurrentMonth: () => setSelectedMonth(currentMonth()),
    clearFilters: () => {
      setTypeFilter("all");
      setStatusFilter("all");
      setTagFilter("all");
      setSelectedMonth(currentMonth());
    },
    listQuery,
  };
}

interface TransactionsActionsArgs {
  readonly formMode: TransactionFormMode;
  readonly closeForm: () => void;
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
}

interface TransactionsActionsState {
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingTransactionId: string | null;
  readonly duplicatingTransactionId: string | null;
  readonly payingTransactionId: string | null;
  readonly clearSubmitError: () => void;
  readonly handleSubmit: (values: CreateTransactionFormValues) => Promise<void>;
  readonly handleDelete: (
    transactionId: string,
    scope?: TransactionDeleteScope,
  ) => Promise<void>;
  readonly handleMarkPaid: (transactionId: string, paidAt: string) => Promise<void>;
  readonly handleDuplicate: (transactionId: string) => Promise<void>;
  readonly dismissSubmitError: () => void;
}

/**
 * Owns the four transaction mutations, the per-transaction action trackers
 * and the shared submit error state for the transactions screen.
 */
// eslint-disable-next-line max-lines-per-function
function useTransactionsActions({
  formMode,
  closeForm,
  transactionsQuery,
}: TransactionsActionsArgs): TransactionsActionsState {
  const createMutation = useCreateTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();
  const deleteMutation = useDeleteTransactionMutation();
  const markPaidMutation = useMarkTransactionPaidMutation();
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [duplicatingTransactionId, setDuplicatingTransactionId] = useState<string | null>(null);
  const [payingTransactionId, setPayingTransactionId] = useState<string | null>(null);

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
      closeForm();
    } catch (error) {
      setSubmitError(error);
    }
  };

  const handleDelete = async (
    transactionId: string,
    scope: TransactionDeleteScope = "occurrence",
  ): Promise<void> => {
    setDeletingTransactionId(transactionId);
    try {
      await deleteMutation.mutateAsync({ transactionId, scope });
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const handleMarkPaid = async (
    transactionId: string,
    paidAt: string,
  ): Promise<void> => {
    setPayingTransactionId(transactionId);
    setSubmitError(null);
    try {
      await markPaidMutation.mutateAsync({ transactionId, paidAt });
    } catch (error) {
      setSubmitError(error);
    } finally {
      setPayingTransactionId(null);
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
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
    deletingTransactionId,
    duplicatingTransactionId,
    payingTransactionId,
    clearSubmitError: () => setSubmitError(null),
    handleSubmit,
    handleDelete,
    handleMarkPaid,
    handleDuplicate,
    dismissSubmitError: () => {
      setSubmitError(null);
      createMutation.reset();
      updateMutation.reset();
      markPaidMutation.reset();
    },
  };
}

const computeMonthBalance = (records: readonly TransactionRecord[]): number =>
  records.reduce((sum, record) => {
    if (record.status === "cancelled") {
      return sum;
    }
    const value = Number.parseFloat(record.amount);
    if (Number.isNaN(value)) {
      return sum;
    }
    return record.type === "income" ? sum + value : sum - value;
  }, 0);

interface TransactionsDerived {
  readonly monthBalance: number;
  readonly hasActiveFilters: boolean;
}

/** Deriva o saldo do período (net) e se há filtro de tipo/status/tag ativo. */
function useTransactionsDerived(
  transactionsQuery: ReturnType<typeof useTransactionsQuery>,
  filters: TransactionsFiltersState,
): TransactionsDerived {
  const monthBalance = useMemo<number>(
    () => computeMonthBalance(transactionsQuery.data?.transactions ?? []),
    [transactionsQuery.data],
  );
  const hasActiveFilters =
    filters.typeFilter !== "all" ||
    filters.statusFilter !== "all" ||
    filters.tagFilter !== "all";
  return { monthBalance, hasActiveFilters };
}

/**
 * Canonical controller for the transactions screen. Owns the create/edit
 * form state machine, server-side filters (type, status, tag and monthly
 * period — web parity), the per-transaction delete/pay trackers and the
 * mutations. The screen remains view-only.
 */
 
// eslint-disable-next-line max-lines-per-function -- agregador: mapeia ~35 campos do controller
export function useTransactionsScreenController(): TransactionsScreenController {
  const filters = useTransactionsFilters();
  const transactionsQuery = useTransactionsQuery(filters.listQuery);
  const [formMode, setFormMode] = useState<TransactionFormMode>({ kind: "closed" });
  const searchParams = useLocalSearchParams<{ readonly intent?: string }>();
  const quickCreateHandled = useRef(false);

  // Atalho do botão central [+] da tab bar (F2): /transacoes?intent=create
  // abre o form de criação uma única vez por montagem — fechar o form não
  // deve reabri-lo enquanto o param continua na rota.
  useEffect(() => {
    if (searchParams.intent === "create" && !quickCreateHandled.current) {
      quickCreateHandled.current = true;
      setFormMode({ kind: "create" });
    }
  }, [searchParams.intent]);

  const [viewMode, setViewMode] = useState<TransactionsViewMode>("list");
  const [installmentGroupFilter, setInstallmentGroupFilter] = useState<string | null>(null);
  const actions = useTransactionsActions({
    formMode,
    closeForm: () => setFormMode({ kind: "closed" }),
    transactionsQuery,
  });

  const transactions = useMemo<readonly TransactionViewModel[]>(() => {
    const records = transactionsQuery.data?.transactions ?? [];
    const installmentNumbers = buildInstallmentNumberMap(records);
    return records
      .filter((record) => matchesFilter(record.type, filters.typeFilter))
      .filter((record) =>
        installmentGroupFilter ? record.installmentGroupId === installmentGroupFilter : true,
      )
      .map((record) => toViewModel(record, installmentNumbers.get(record.id) ?? null));
  }, [installmentGroupFilter, transactionsQuery.data, filters.typeFilter]);

  const derived = useTransactionsDerived(transactionsQuery, filters);

  return {
    transactionsQuery,
    transactions,
    total: transactionsQuery.data?.pagination.total ?? 0,
    monthBalance: derived.monthBalance,
    hasActiveFilters: derived.hasActiveFilters,
    typeFilter: filters.typeFilter,
    setTypeFilter: filters.setTypeFilter,
    statusFilter: filters.statusFilter,
    setStatusFilter: filters.setStatusFilter,
    tagFilter: filters.tagFilter,
    setTagFilter: filters.setTagFilter,
    periodLabel: filters.periodLabel,
    goToPreviousMonth: filters.goToPreviousMonth,
    goToNextMonth: filters.goToNextMonth,
    resetToCurrentMonth: filters.resetToCurrentMonth,
    clearFilters: filters.clearFilters,
    installmentGroupFilter,
    viewMode,
    setViewMode,
    formMode,
    isSubmitting: actions.isSubmitting,
    submitError: actions.submitError,
    deletingTransactionId: actions.deletingTransactionId,
    duplicatingTransactionId: actions.duplicatingTransactionId,
    payingTransactionId: actions.payingTransactionId,
    handleOpenCreate: () => {
      actions.clearSubmitError();
      setFormMode({ kind: "create" });
    },
    handleOpenEdit: (transaction) => {
      actions.clearSubmitError();
      setFormMode({ kind: "edit", transaction });
    },
    handleCloseForm: () => {
      actions.clearSubmitError();
      setFormMode({ kind: "closed" });
    },
    handleSubmit: actions.handleSubmit,
    handleDelete: actions.handleDelete,
    handleMarkPaid: actions.handleMarkPaid,
    handleDuplicate: actions.handleDuplicate,
    handleShowInstallmentGroup: (installmentGroupId) => {
      setInstallmentGroupFilter(installmentGroupId);
      filters.setTypeFilter("expense");
    },
    handleClearInstallmentGroupFilter: () => {
      setInstallmentGroupFilter(null);
    },
    dismissSubmitError: actions.dismissSubmitError,
  };
}
