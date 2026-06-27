import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import { appRoutes } from "@/core/navigation/routes";
import { queryKeys } from "@/core/query/query-keys";
import type {
  CreditCard,
  CreditCardBillRecord,
} from "@/features/credit-cards/contracts";
import { useCreditCardBillQuery } from "@/features/credit-cards/hooks/use-credit-card-bill-query";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import {
  billWindowStartDate,
  monthEndDate,
} from "@/features/credit-cards/model/billing-month";
import {
  type CreditCardBillTransactionGroup,
  formatCreditCardBillCycleLabel,
  formatCreditCardBillMonthLabel,
  getCurrentCreditCardBillMonth,
  groupCreditCardBillTransactionsByDate,
  shiftCreditCardBillMonth,
} from "@/features/credit-cards/model/credit-card-bill-format";
import {
  enrichCardTransactions,
  type EnrichedTransaction,
} from "@/features/credit-cards/model/card-transactions";
import {
  buildCreditCardInvoiceViewModel,
  type CreditCardInvoiceViewModel,
} from "@/features/credit-cards/model/credit-card-invoice";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import type {
  CreateTransactionCommand,
  TransactionRecord,
} from "@/features/transactions/contracts";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { useExpenseSheetStore } from "@/stores/expense-sheet-store";

// Re-exporta os helpers puros (movidos para o modelo) para preservar os imports
// existentes a partir deste controller.
export {
  type CreditCardBillTransactionGroup,
  formatCreditCardBillCycleLabel,
  formatCreditCardBillDate,
  formatCreditCardBillMonthLabel,
  getCurrentCreditCardBillMonth,
  groupCreditCardBillTransactionsByDate,
  shiftCreditCardBillMonth,
} from "@/features/credit-cards/model/credit-card-bill-format";

/** Quantidade de meses da janela de transações da fatura (inclui o mês atual). */
export const CREDIT_CARD_BILL_WINDOW_MONTHS = 2;

/** Tamanho de página pedido ao listar transações da fatura. */
export const CREDIT_CARD_BILL_TRANSACTION_PAGE_SIZE = 500;

export interface CreditCardBillScreenController {
  readonly creditCardId: string;
  readonly creditCard: CreditCard | null;
  readonly selectedMonth: string;
  readonly selectedMonthLabel: string;
  readonly bill: CreditCardBillRecord | null;
  readonly billQuery: ReturnType<typeof useCreditCardBillQuery>;
  readonly creditCardsQuery: ReturnType<typeof useCreditCardsQuery>;
  readonly tagsQuery: ReturnType<typeof useTagsQuery>;
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
  readonly groupedTransactions: readonly CreditCardBillTransactionGroup[];
  readonly cycleLabel: string | null;
  /** View-model derivado da fatura; null quando o cartão não existe. */
  readonly invoice: CreditCardInvoiceViewModel | null;
  readonly handlePreviousMonth: () => void;
  readonly handleNextMonth: () => void;
  readonly handleBack: () => void;
  /** Placeholder — pagar fatura ainda não tem backend (no-op intencional). */
  readonly handlePayBill: () => void;
  readonly handleEditExpense: (item: EnrichedTransaction) => void;
  readonly handleDuplicateExpense: (item: EnrichedTransaction) => Promise<void>;
  readonly requestDeleteExpense: (item: EnrichedTransaction) => void;
  readonly confirmDeleteExpense: () => Promise<void>;
  readonly closeDeleteExpense: () => void;
  readonly deleteTarget: CreditCardExpenseDeleteTarget | null;
  readonly isDeletingExpense: boolean;
  readonly duplicatingTransactionId: string | null;
  readonly expenseActionError: unknown | null;
}

export interface CreditCardBillScreenControllerOptions {
  readonly creditCardId?: string;
  readonly initialMonth?: string;
}

const resolveStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

/** Argumentos para derivar o view-model da fatura. */
interface InvoiceViewModelArgs {
  readonly creditCard: CreditCard | null;
  readonly transactions: readonly TransactionRecordLike[];
  readonly tags: ReturnType<typeof useTagsQuery>["data"];
  readonly bill: CreditCardBillRecord | null;
  readonly month: string;
}

/** Forma mínima de transação consumida aqui (alias do contrato cru). */
type TransactionRecordLike = Parameters<typeof enrichCardTransactions>[0][number];

export interface CreditCardExpenseDeleteTarget {
  readonly id: string;
  readonly title: string;
  readonly isSeries: boolean;
}

const buildDuplicateExpensePayload = (
  transaction: TransactionRecord,
): CreateTransactionCommand => ({
  title: `${transaction.title} (cópia)`,
  amount: transaction.amount,
  type: transaction.type,
  dueDate: transaction.dueDate,
  status: "pending",
  tagId: transaction.tagId,
  accountId: transaction.accountId,
  creditCardId: transaction.creditCardId,
  description: transaction.description ?? transaction.observation ?? null,
  currency: transaction.currency,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
});

/**
 * Deriva o view-model da fatura cruzando transações + tags com a fatura oficial.
 * Isolado do controller para mantê-lo enxuto (DRY/legibilidade).
 *
 * @param args Cartão, transações, tags, fatura oficial e mês.
 * @returns View-model da fatura, ou null quando o cartão não existe.
 */
const useInvoiceViewModel = (
  args: InvoiceViewModelArgs,
): CreditCardInvoiceViewModel | null => {
  return useMemo<CreditCardInvoiceViewModel | null>(() => {
    if (args.creditCard === null) {
      return null;
    }
    const enriched = enrichCardTransactions(args.transactions, [args.creditCard]);
    return buildCreditCardInvoiceViewModel({
      card: args.creditCard,
      transactions: enriched,
      tags: args.tags?.tags ?? [],
      bill: args.bill,
      month: args.month,
    });
  }, [args.creditCard, args.transactions, args.tags, args.bill, args.month]);
};

interface CreditCardBillData {
  readonly creditCard: CreditCard | null;
  readonly bill: CreditCardBillRecord | null;
  readonly billQuery: ReturnType<typeof useCreditCardBillQuery>;
  readonly creditCardsQuery: ReturnType<typeof useCreditCardsQuery>;
  readonly tagsQuery: ReturnType<typeof useTagsQuery>;
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
  readonly groupedTransactions: readonly CreditCardBillTransactionGroup[];
  readonly cycleLabel: string | null;
  readonly invoice: CreditCardInvoiceViewModel | null;
}

const useCreditCardBillData = (
  creditCardId: string,
  selectedMonth: string,
): CreditCardBillData => {
  const creditCardsQuery = useCreditCardsQuery();
  const tagsQuery = useTagsQuery();
  const billQuery = useCreditCardBillQuery(creditCardId, selectedMonth);
  const transactionsQuery = useTransactionsQuery({
    type: "expense",
    creditCardId,
    startDate: billWindowStartDate(selectedMonth, CREDIT_CARD_BILL_WINDOW_MONTHS),
    endDate: monthEndDate(selectedMonth),
    perPage: CREDIT_CARD_BILL_TRANSACTION_PAGE_SIZE,
  });
  const creditCard = useMemo(() => {
    return (
      creditCardsQuery.data?.creditCards.find((entry) => entry.id === creditCardId) ??
      null
    );
  }, [creditCardId, creditCardsQuery.data?.creditCards]);
  const bill = billQuery.data ?? null;
  const groupedTransactions = useMemo(
    () => groupCreditCardBillTransactionsByDate(bill?.transactions ?? []),
    [bill?.transactions],
  );
  const cycleLabel = useMemo(
    () => (bill === null ? null : formatCreditCardBillCycleLabel(bill)),
    [bill],
  );

  const invoice = useInvoiceViewModel({
    creditCard,
    transactions: transactionsQuery.data?.transactions ?? [],
    tags: tagsQuery.data,
    bill,
    month: selectedMonth,
  });

  return {
    creditCard,
    bill,
    billQuery,
    creditCardsQuery,
    tagsQuery,
    transactionsQuery,
    groupedTransactions,
    cycleLabel,
    invoice,
  };
};

interface BillNavigation {
  readonly handlePreviousMonth: () => void;
  readonly handleNextMonth: () => void;
  readonly handleBack: () => void;
}

const useBillNavigation = (
  setSelectedMonth: Dispatch<SetStateAction<string>>,
): BillNavigation => {
  const router = useRouter();
  const handlePreviousMonth = useCallback((): void => {
    setSelectedMonth((current) => shiftCreditCardBillMonth(current, -1));
  }, [setSelectedMonth]);

  const handleNextMonth = useCallback((): void => {
    setSelectedMonth((current) => shiftCreditCardBillMonth(current, 1));
  }, [setSelectedMonth]);

  const handleBack = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(appRoutes.private.creditCards);
  }, [router]);

  return { handlePreviousMonth, handleNextMonth, handleBack };
};

interface ExpenseActions {
  readonly handleEditExpense: (item: EnrichedTransaction) => void;
  readonly handleDuplicateExpense: (item: EnrichedTransaction) => Promise<void>;
  readonly requestDeleteExpense: (item: EnrichedTransaction) => void;
  readonly confirmDeleteExpense: () => Promise<void>;
  readonly closeDeleteExpense: () => void;
  readonly deleteTarget: CreditCardExpenseDeleteTarget | null;
  readonly isDeletingExpense: boolean;
  readonly duplicatingTransactionId: string | null;
  readonly expenseActionError: unknown | null;
}

interface ConfirmDeleteExpenseArgs {
  readonly deleteTarget: CreditCardExpenseDeleteTarget | null;
  readonly deleteTransactionMutation: ReturnType<typeof useDeleteTransactionMutation>;
  readonly invalidateExpenseSurfaces: () => Promise<void>;
  readonly setDeleteTarget: Dispatch<
    SetStateAction<CreditCardExpenseDeleteTarget | null>
  >;
  readonly setDeletingTransactionId: Dispatch<SetStateAction<string | null>>;
  readonly setExpenseActionError: Dispatch<SetStateAction<unknown | null>>;
}

const useConfirmDeleteExpense = (
  args: ConfirmDeleteExpenseArgs,
): (() => Promise<void>) => {
  const {
    deleteTarget,
    deleteTransactionMutation,
    invalidateExpenseSurfaces,
    setDeleteTarget,
    setDeletingTransactionId,
    setExpenseActionError,
  } = args;

  return useCallback(async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }
    setDeletingTransactionId(deleteTarget.id);
    setExpenseActionError(null);
    try {
      await deleteTransactionMutation.mutateAsync({
        transactionId: deleteTarget.id,
        scope: "occurrence",
      });
      await invalidateExpenseSurfaces();
      setDeleteTarget(null);
    } catch (error) {
      setExpenseActionError(error);
    } finally {
      setDeletingTransactionId(null);
    }
  }, [
    deleteTarget,
    deleteTransactionMutation,
    invalidateExpenseSurfaces,
    setDeleteTarget,
    setDeletingTransactionId,
    setExpenseActionError,
  ]);
};

const useExpenseActions = (): ExpenseActions => {
  const queryClient = useQueryClient();
  const openExpenseEdit = useExpenseSheetStore((state) => state.openEdit);
  const createTransactionMutation = useCreateTransactionMutation();
  const deleteTransactionMutation = useDeleteTransactionMutation();
  const [deleteTarget, setDeleteTarget] =
    useState<CreditCardExpenseDeleteTarget | null>(null);
  const [duplicatingTransactionId, setDuplicatingTransactionId] = useState<
    string | null
  >(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(
    null,
  );
  const [expenseActionError, setExpenseActionError] = useState<unknown | null>(null);

  const invalidateExpenseSurfaces = useCallback(async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root }),
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.root }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.root }),
    ]);
  }, [queryClient]);

  const handleEditExpense = useCallback(
    (item: EnrichedTransaction): void => {
      openExpenseEdit(item.transaction);
    },
    [openExpenseEdit],
  );

  const handleDuplicateExpense = useCallback(
    async (item: EnrichedTransaction): Promise<void> => {
      setDuplicatingTransactionId(item.id);
      setExpenseActionError(null);
      try {
        await createTransactionMutation.mutateAsync(
          buildDuplicateExpensePayload(item.transaction),
        );
        await invalidateExpenseSurfaces();
      } catch (error) {
        setExpenseActionError(error);
      } finally {
        setDuplicatingTransactionId(null);
      }
    },
    [createTransactionMutation, invalidateExpenseSurfaces],
  );

  const requestDeleteExpense = useCallback((item: EnrichedTransaction): void => {
    setExpenseActionError(null);
    setDeleteTarget({
      id: item.transaction.id,
      title: item.transaction.title,
      isSeries: item.transaction.isRecurring || item.transaction.isInstallment,
    });
  }, []);

  const closeDeleteExpense = useCallback((): void => {
    setDeleteTarget(null);
  }, []);

  const confirmDeleteExpense = useConfirmDeleteExpense({
    deleteTarget,
    deleteTransactionMutation,
    invalidateExpenseSurfaces,
    setDeleteTarget,
    setDeletingTransactionId,
    setExpenseActionError,
  });

  return {
    handleEditExpense,
    handleDuplicateExpense,
    requestDeleteExpense,
    confirmDeleteExpense,
    closeDeleteExpense,
    deleteTarget,
    isDeletingExpense:
      deletingTransactionId !== null || deleteTransactionMutation.isPending,
    duplicatingTransactionId,
    expenseActionError,
  };
};

interface BuildControllerArgs {
  readonly creditCardId: string;
  readonly selectedMonth: string;
  readonly data: CreditCardBillData;
  readonly navigation: BillNavigation;
  readonly actions: ExpenseActions;
}

const buildController = (args: BuildControllerArgs): CreditCardBillScreenController => {
  const { actions, creditCardId, data, navigation, selectedMonth } = args;
  return {
    creditCardId,
    creditCard: data.creditCard,
    selectedMonth,
    selectedMonthLabel: formatCreditCardBillMonthLabel(selectedMonth),
    bill: data.bill,
    billQuery: data.billQuery,
    creditCardsQuery: data.creditCardsQuery,
    tagsQuery: data.tagsQuery,
    transactionsQuery: data.transactionsQuery,
    groupedTransactions: data.groupedTransactions,
    cycleLabel: data.cycleLabel,
    invoice: data.invoice,
    handlePreviousMonth: navigation.handlePreviousMonth,
    handleNextMonth: navigation.handleNextMonth,
    handleBack: navigation.handleBack,
    handlePayBill: noopPayBill,
    handleEditExpense: actions.handleEditExpense,
    handleDuplicateExpense: actions.handleDuplicateExpense,
    requestDeleteExpense: actions.requestDeleteExpense,
    confirmDeleteExpense: actions.confirmDeleteExpense,
    closeDeleteExpense: actions.closeDeleteExpense,
    deleteTarget: actions.deleteTarget,
    isDeletingExpense: actions.isDeletingExpense,
    duplicatingTransactionId: actions.duplicatingTransactionId,
    expenseActionError: actions.expenseActionError,
  };
};

export function useCreditCardBillScreenController(
  options: CreditCardBillScreenControllerOptions = {},
): CreditCardBillScreenController {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const creditCardId = options.creditCardId ?? resolveStringParam(params.id);
  const [selectedMonth, setSelectedMonth] = useState(
    () => options.initialMonth ?? getCurrentCreditCardBillMonth(),
  );
  const data = useCreditCardBillData(creditCardId, selectedMonth);
  const navigation = useBillNavigation(setSelectedMonth);
  const actions = useExpenseActions();

  return buildController({
    actions,
    creditCardId,
    data,
    navigation,
    selectedMonth,
  });
}

/**
 * Placeholder da ação "Pagar fatura" — ainda sem backend. Mantido nomeado para
 * deixar explícito que é um no-op intencional (ver PR/handoff).
 */
const noopPayBill = (): void => {
  /* Sem backend para pagamento de fatura ainda. */
};
