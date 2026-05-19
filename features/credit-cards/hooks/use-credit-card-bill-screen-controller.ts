import { useCallback, useMemo, useState } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import { appRoutes } from "@/core/navigation/routes";
import type {
  CreditCard,
  CreditCardBillRecord,
  CreditCardBillTransaction,
} from "@/features/credit-cards/contracts";
import { useCreditCardBillQuery } from "@/features/credit-cards/hooks/use-credit-card-bill-query";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export interface CreditCardBillTransactionGroup {
  readonly key: string;
  readonly label: string;
  readonly transactions: readonly CreditCardBillTransaction[];
}

export interface CreditCardBillScreenController {
  readonly creditCardId: string;
  readonly creditCard: CreditCard | null;
  readonly selectedMonth: string;
  readonly selectedMonthLabel: string;
  readonly bill: CreditCardBillRecord | null;
  readonly billQuery: ReturnType<typeof useCreditCardBillQuery>;
  readonly creditCardsQuery: ReturnType<typeof useCreditCardsQuery>;
  readonly groupedTransactions: readonly CreditCardBillTransactionGroup[];
  readonly cycleLabel: string | null;
  readonly handlePreviousMonth: () => void;
  readonly handleNextMonth: () => void;
  readonly handleBack: () => void;
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

const padMonth = (value: number): string => value.toString().padStart(2, "0");

export const getCurrentCreditCardBillMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${padMonth(now.getMonth() + 1)}`;
};

export const shiftCreditCardBillMonth = (
  month: string,
  offset: number,
): string => {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const monthIndex = Number.parseInt(monthRaw ?? "", 10) - 1;
  const date = new Date(year, monthIndex + offset, 1);
  return `${date.getFullYear()}-${padMonth(date.getMonth() + 1)}`;
};

export const formatCreditCardBillMonthLabel = (month: string): string => {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const monthIndex = Number.parseInt(monthRaw ?? "", 10) - 1;
  const date = new Date(year, monthIndex, 1);
  return monthFormatter.format(date);
};

export const formatCreditCardBillDate = (value: string): string => {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const month = Number.parseInt(monthRaw ?? "", 10);
  const day = Number.parseInt(dayRaw ?? "", 10);
  return dateFormatter.format(new Date(year, month - 1, day));
};

export const formatCreditCardBillCycleLabel = (
  bill: CreditCardBillRecord,
): string => {
  return `${formatCreditCardBillDate(bill.cycle.startDate)} a ${formatCreditCardBillDate(
    bill.cycle.endDate,
  )} · vence ${formatCreditCardBillDate(bill.cycle.dueDate)}`;
};

export const groupCreditCardBillTransactionsByDate = (
  transactions: readonly CreditCardBillTransaction[],
): readonly CreditCardBillTransactionGroup[] => {
  const sortedTransactions = [...transactions].sort((left, right) => {
    const leftDate = left.dueDate ?? "9999-12-31";
    const rightDate = right.dueDate ?? "9999-12-31";
    return leftDate.localeCompare(rightDate);
  });
  const groups = new Map<string, CreditCardBillTransaction[]>();

  for (const transaction of sortedTransactions) {
    const key = transaction.dueDate ?? "without-date";
    groups.set(key, [...(groups.get(key) ?? []), transaction]);
  }

  return [...groups.entries()].map(([key, transactionsForDate]) => ({
    key,
    label: key === "without-date" ? "Sem data" : formatCreditCardBillDate(key),
    transactions: transactionsForDate,
  }));
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
  const billQuery = useCreditCardBillQuery(creditCardId, selectedMonth);
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
    groupedTransactions,
    cycleLabel,
    handlePreviousMonth,
    handleNextMonth,
    handleBack,
  };
}
