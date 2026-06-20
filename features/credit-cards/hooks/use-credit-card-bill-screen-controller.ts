import { useCallback, useMemo, useState } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import { appRoutes } from "@/core/navigation/routes";
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
import { enrichCardTransactions } from "@/features/credit-cards/model/card-transactions";
import {
  buildCreditCardInvoiceViewModel,
  type CreditCardInvoiceViewModel,
} from "@/features/credit-cards/model/credit-card-invoice";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";

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

export function useCreditCardBillScreenController(
  options: CreditCardBillScreenControllerOptions = {},
): CreditCardBillScreenController {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const creditCardId = options.creditCardId ?? resolveStringParam(params.id);
  const [selectedMonth, setSelectedMonth] = useState(
    () => options.initialMonth ?? getCurrentCreditCardBillMonth(),
  );

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

  const handlePreviousMonth = useCallback((): void => {
    setSelectedMonth((current) => shiftCreditCardBillMonth(current, -1));
  }, []);

  const handleNextMonth = useCallback((): void => {
    setSelectedMonth((current) => shiftCreditCardBillMonth(current, 1));
  }, []);

  const handleBack = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(appRoutes.private.creditCards);
  }, [router]);

  return {
    creditCardId,
    creditCard,
    selectedMonth,
    selectedMonthLabel: formatCreditCardBillMonthLabel(selectedMonth),
    bill,
    billQuery,
    creditCardsQuery,
    tagsQuery,
    transactionsQuery,
    groupedTransactions,
    cycleLabel,
    invoice,
    handlePreviousMonth,
    handleNextMonth,
    handleBack,
    handlePayBill: noopPayBill,
  };
}

/**
 * Placeholder da ação "Pagar fatura" — ainda sem backend. Mantido nomeado para
 * deixar explícito que é um no-op intencional (ver PR/handoff).
 */
const noopPayBill = (): void => {
  /* Sem backend para pagamento de fatura ainda. */
};
