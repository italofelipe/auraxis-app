/**
 * Enriquecimento puro de transações de cartão com o mês de fatura (billMonth) e
 * resolução do ciclo de um cartão para um mês.
 *
 * Portado das funções puras e testadas do auraxis-web
 * (`app/features/credit-cards/utils/transaction-billing.ts`), adaptado para os
 * contratos camelCase do app (`TransactionRecord`, `CreditCard`). As funções de
 * mês (`parseMonthKey`, etc.) são reutilizadas de `billing-month.ts` (DRY).
 */

import type { CreditCard } from "@/features/credit-cards/contracts";
import type { TransactionRecord } from "@/features/transactions/contracts";

import { parseMonthKey } from "./billing-month";
import {
  type BillingCyclePreview,
  resolveCreditCardBillingCycle,
} from "./billing-cycle";

/**
 * Transação de cartão enriquecida com o mês de fatura (billMonth) e o valor já
 * coagido para number. Forma de domínio consumida pelas agregações e views.
 */
export interface EnrichedTransaction {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  /** Data da compra (`YYYY-MM-DD`). */
  readonly purchaseDate: string;
  readonly tagId: string | null;
  readonly creditCardId: string | null;
  /** Mês da fatura em que a compra cai (`YYYY-MM`); null se o cartão não tem ciclo. */
  readonly billMonth: string | null;
  readonly isInstallment: boolean;
  readonly installmentCount: number | null;
  readonly installmentGroupId: string | null;
  readonly status: string;
  /** Registro canônico de Transações usado para editar/duplicar/remover. */
  readonly transaction: TransactionRecord;
}

/**
 * Coage uma string Decimal para number (0 quando inválida).
 *
 * @param value String monetária.
 * @returns Número finito.
 */
const toAmount = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Enriquece transações de cartão com o mês de fatura, derivado do ciclo do cartão.
 *
 * Transações sem `creditCardId` são descartadas (a área de Cartões só lida com
 * despesas de cartão). Quando o cartão não tem `closingDay`/`dueDay`, o
 * `billMonth` fica null (não é possível resolver o ciclo).
 *
 * @param transactions Transações cruas do backend.
 * @param cards Cartões do usuário (para resolver o ciclo).
 * @returns Transações de cartão enriquecidas.
 */
export const enrichCardTransactions = (
  transactions: readonly TransactionRecord[],
  cards: readonly CreditCard[],
): EnrichedTransaction[] => {
  const cardById = new Map(cards.map((card) => [card.id, card]));

  return transactions
    .filter((tx) => tx.creditCardId !== null)
    .map((tx) => {
      const card = tx.creditCardId
        ? cardById.get(tx.creditCardId) ?? null
        : null;
      let billMonth: string | null = null;

      if (card && card.closingDay !== null && card.dueDay !== null) {
        billMonth = resolveCreditCardBillingCycle({
          purchaseDate: tx.dueDate,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
        }).billMonth;
      }

      return {
        id: tx.id,
        title: tx.title,
        amount: toAmount(tx.amount),
        purchaseDate: tx.dueDate,
        tagId: tx.tagId,
        creditCardId: tx.creditCardId,
        billMonth,
        isInstallment: tx.isInstallment,
        installmentCount: tx.installmentCount,
        installmentGroupId: tx.installmentGroupId,
        status: tx.status,
        transaction: tx,
      };
    });
};

/**
 * Resolve o ciclo de fatura de um cartão cujo fechamento cai no mês informado.
 *
 * Usa o dia de fechamento (clampado ao mês) como data de referência, garantindo
 * que o ciclo retornado tenha `billMonth === month`.
 *
 * @param card Cartão (precisa de `closingDay` e `dueDay`).
 * @param month Mês de fatura (`YYYY-MM`).
 * @returns Preview do ciclo, ou null se o cartão não tem ciclo configurado.
 */
export const resolveCardCycleForMonth = (
  card: Pick<CreditCard, "closingDay" | "dueDay">,
  month: string,
): BillingCyclePreview | null => {
  if (card.closingDay === null || card.dueDay === null) {
    return null;
  }
  const [year, monthIndex] = parseMonthKey(month);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(Math.max(card.closingDay, 1), lastDay);
  const referenceDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
  return resolveCreditCardBillingCycle({
    purchaseDate: referenceDate,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
  });
};
