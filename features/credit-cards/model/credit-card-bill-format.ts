/**
 * Formatação e agrupamento puros da fatura de cartão (mês `YYYY-MM`, datas do
 * ciclo e agrupamento de transações da fatura por data). Extraído do controller
 * para mantê-lo enxuto (≤250 linhas) e isolar a lógica testável da UI.
 */

import type {
  CreditCardBillRecord,
  CreditCardBillTransaction,
} from "@/features/credit-cards/contracts";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const padMonth = (value: number): string => value.toString().padStart(2, "0");

/** Grupo de transações da fatura por data de vencimento. */
export interface CreditCardBillTransactionGroup {
  readonly key: string;
  readonly label: string;
  readonly transactions: readonly CreditCardBillTransaction[];
}

/**
 * Mês de fatura atual (`YYYY-MM`) baseado na data corrente.
 *
 * @returns Chave `YYYY-MM` do mês atual.
 */
export const getCurrentCreditCardBillMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${padMonth(now.getMonth() + 1)}`;
};

/**
 * Desloca um mês de fatura (`YYYY-MM`) por um número de meses.
 *
 * @param month Mês base (`YYYY-MM`).
 * @param offset Deslocamento em meses (negativo = passado).
 * @returns Novo mês (`YYYY-MM`).
 */
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

/**
 * Rótulo extenso do mês de fatura ("junho de 2026").
 *
 * @param month Mês (`YYYY-MM`).
 * @returns Rótulo humano.
 */
export const formatCreditCardBillMonthLabel = (month: string): string => {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const monthIndex = Number.parseInt(monthRaw ?? "", 10) - 1;
  const date = new Date(year, monthIndex, 1);
  return monthFormatter.format(date);
};

/**
 * Formata uma data `YYYY-MM-DD` no padrão curto pt-BR ("05 de mai. de 2026").
 *
 * @param value Data ISO (somente data).
 * @returns Data formatada.
 */
export const formatCreditCardBillDate = (value: string): string => {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const month = Number.parseInt(monthRaw ?? "", 10);
  const day = Number.parseInt(dayRaw ?? "", 10);
  return dateFormatter.format(new Date(year, month - 1, day));
};

/**
 * Rótulo do ciclo da fatura ("início a fim · vence vencimento").
 *
 * @param bill Fatura oficial.
 * @returns Rótulo do ciclo.
 */
export const formatCreditCardBillCycleLabel = (
  bill: CreditCardBillRecord,
): string => {
  return `${formatCreditCardBillDate(bill.cycle.startDate)} a ${formatCreditCardBillDate(
    bill.cycle.endDate,
  )} · vence ${formatCreditCardBillDate(bill.cycle.dueDate)}`;
};

/**
 * Agrupa transações da fatura por data de vencimento (ordenadas crescente; as
 * sem data vão para o fim).
 *
 * @param transactions Transações da fatura.
 * @returns Grupos por data.
 */
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
