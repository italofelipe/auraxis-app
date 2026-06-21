/**
 * View-model puro da tela "Detalhe da fatura": hero (gradiente da marca, total,
 * status, vencimento), breakdown "Onde foi gasto" (barras por categoria) e os
 * itens da fatura agrupados POR CATEGORIA.
 *
 * Prefere os números oficiais da fatura do backend (`CreditCardBillRecord`)
 * quando disponíveis e cai para a agregação das transações da janela. Reaproveita
 * `groupByCategory` (já testado) e o token de gradiente de marca. Sem UI.
 */

import type {
  CreditCard,
  CreditCardBillRecord,
} from "@/features/credit-cards/contracts";
import type { Tag } from "@/features/tags/contracts";
import { resolveCardGradient, type GradientStops } from "@/shared/theme";

import type { EnrichedTransaction } from "./card-transactions";
import {
  type CategoryGroup,
  filterByBillMonth,
  groupByCategory,
  sumAmount,
} from "./credit-card-aggregation";

/** Pílula de status da fatura. */
export interface InvoiceStatusVM {
  readonly label: string;
  readonly tone: "open" | "closed";
}

/** Barra de uma categoria no breakdown "Onde foi gasto". */
export interface InvoiceCategoryBar {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly value: number;
}

/** View-model completo da tela "Detalhe da fatura". */
export interface CreditCardInvoiceViewModel {
  /** Gradiente de marca para o hero. */
  readonly gradient: GradientStops;
  /** Total da fatura (oficial quando disponível, senão derivado). */
  readonly total: number;
  /** Pílula de status (Aberta/Fechada), ou null quando indefinido. */
  readonly status: InvoiceStatusVM | null;
  /** Vencimento no formato `DD/MM`, ou null quando ausente. */
  readonly dueDateLabel: string | null;
  /** Quantidade de itens da fatura. */
  readonly itemCount: number;
  /** Barras por categoria ("Onde foi gasto"), ordenadas por total desc. */
  readonly categoryBreakdown: readonly InvoiceCategoryBar[];
  /** Itens agrupados por categoria (ordenados por total desc). */
  readonly groupedByCategory: readonly CategoryGroup[];
}

/** Parâmetros para montar o view-model da fatura. */
export interface CreditCardInvoiceParams {
  readonly card: CreditCard;
  /** Transações já enriquecidas e escopadas a este cartão. */
  readonly transactions: readonly EnrichedTransaction[];
  readonly tags: readonly Tag[];
  /** Fatura oficial do backend (preferida quando presente). */
  readonly bill?: CreditCardBillRecord | null;
  /** Mês de fatura selecionado (`YYYY-MM`). */
  readonly month: string;
}

/**
 * Converte o status cru do ciclo (open/closed/...) na pílula da fatura.
 *
 * @param status Status cru do backend.
 * @returns Pílula de status, ou null quando ausente.
 */
const statusFromCycle = (status: string | undefined): InvoiceStatusVM | null => {
  if (!status) {
    return null;
  }
  const normalized = status.toLowerCase();
  if (normalized.includes("clos") || normalized.includes("fech")) {
    return { label: "Fechada", tone: "closed" };
  }
  return { label: "Aberta", tone: "open" };
};

/**
 * Formata uma data `YYYY-MM-DD` como `DD/MM`.
 *
 * @param date Data ISO (somente data), ou null.
 * @returns Rótulo `DD/MM`, ou null quando a entrada é inválida/ausente.
 */
const toDayMonthLabel = (date: string | null | undefined): string | null => {
  if (!date) {
    return null;
  }
  const match = /^\d{4}-(\d{2})-(\d{2})$/u.exec(date);
  return match ? `${match[2]}/${match[1]}` : null;
};

const toCategoryBar = (group: CategoryGroup): InvoiceCategoryBar => ({
  id: group.tagId ?? "uncategorized",
  label: group.name,
  color: group.color,
  value: group.total,
});

/**
 * Monta o view-model da tela "Detalhe da fatura" a partir dos dados carregados.
 *
 * @param params Cartão, transações escopadas, tags, fatura oficial e mês.
 * @returns View-model da fatura.
 */
export const buildCreditCardInvoiceViewModel = (
  params: CreditCardInvoiceParams,
): CreditCardInvoiceViewModel => {
  const monthTxs = filterByBillMonth(params.transactions, params.month);
  const grouped = groupByCategory(monthTxs, params.tags);
  const derivedTotal = sumAmount(monthTxs);
  const bill = params.bill ?? null;

  return {
    gradient: resolveCardGradient({
      id: params.card.id,
      bank: params.card.bank,
      name: params.card.name,
    }),
    total: bill ? bill.totalAmount : derivedTotal,
    status: statusFromCycle(bill?.cycle.status),
    dueDateLabel: toDayMonthLabel(bill?.cycle.dueDate),
    itemCount: bill ? bill.transactions.length : monthTxs.length,
    categoryBreakdown: grouped.map(toCategoryBar),
    groupedByCategory: grouped,
  };
};
