/**
 * View-model puro da visão "Analítico" de cartões (KPIs, série mensal por
 * cartão, categorias, totais por cartão e maiores lançamentos).
 *
 * Portado das funções puras e testadas do auraxis-web
 * (`app/features/credit-cards/model/credit-card-analytics.ts`), adaptado para os
 * contratos camelCase do app (`CreditCard`, `CreditCardUtilizationRecord`,
 * `Tag`). Reutiliza `billing-month.ts` para o cálculo de meses. Sem dependência
 * de UI ou framework.
 */

import type {
  CreditCard,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import type { Tag } from "@/features/tags/contracts";
import { NO_CATEGORY_COLOR, resolveCategoryColor } from "@/shared/theme";

import { billMonthsWindow, shiftMonthKey } from "./billing-month";
import type { EnrichedTransaction } from "./card-transactions";
import {
  type CardTotal,
  type CategoryGroup,
  type MonthVariation,
  type MonthlyCardSeries,
  NO_CATEGORY_LABEL,
  buildMonthlySeriesByCard,
  cardBreakdown,
  filterByBillMonth,
  filterByCard,
  groupByCategory,
  monthVariation,
  sumAmount,
  topTransactions,
} from "./credit-card-aggregation";

/** Categoria de maior gasto destacada num KPI. */
export interface TopCategoryVM {
  readonly name: string;
  readonly color: string;
  readonly total: number;
}

/** KPIs da visão Analítico. */
export interface AnalyticsKpis {
  readonly billTotal: number;
  readonly variation: MonthVariation;
  readonly topCategory: TopCategoryVM | null;
  readonly limitUsedPct: number | null;
}

/** Linha da tabela de maiores lançamentos (com nomes já resolvidos). */
export interface TopRow {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly isInstallment: boolean;
  readonly installmentCount: number | null;
  readonly purchaseDate: string;
  readonly categoryName: string;
  readonly categoryColor: string;
  readonly cardName: string;
}

/** View-model completo da visão Analítico. */
export interface AnalyticsViewModel {
  readonly month: string;
  readonly cardId: string | null;
  readonly kpis: AnalyticsKpis;
  readonly monthlySeries: MonthlyCardSeries;
  readonly categories: readonly CategoryGroup[];
  readonly cardTotals: readonly CardTotal[];
  readonly topTransactions: readonly EnrichedTransaction[];
  readonly topRows: readonly TopRow[];
}

/** Parâmetros para montar a visão Analítico. */
export interface AnalyticsParams {
  readonly transactions: readonly EnrichedTransaction[];
  readonly tags: readonly Tag[];
  readonly cards: readonly CreditCard[];
  readonly month: string;
  readonly cardId: string | null;
  /** Utilização oficial do backend (apenas para cartão único). */
  readonly utilization?: CreditCardUtilizationRecord | null;
  /** Tamanho da janela temporal (default 6). */
  readonly windowMonths?: number;
  /** Quantidade de maiores lançamentos (default 7). */
  readonly topCount?: number;
}

/**
 * Calcula o percentual de limite usado no mês.
 *
 * @param params Parâmetros da visão (cartão e utilização).
 * @param billTotal Total gasto no mês selecionado.
 * @param scopedCards Cartões dentro do escopo (um, ou todos).
 * @returns Percentual de limite usado, ou null sem base de limite.
 */
const computeLimitUsedPct = (
  params: AnalyticsParams,
  billTotal: number,
  scopedCards: readonly CreditCard[],
): number | null => {
  if (params.cardId !== null && params.utilization) {
    return params.utilization.utilizationPct;
  }
  const totalLimit = scopedCards
    .filter((card) => card.limitAmount !== null)
    .reduce((sum, card) => sum + (card.limitAmount ?? 0), 0);
  if (totalLimit <= 0) {
    return null;
  }
  return (billTotal / totalLimit) * 100;
};

/**
 * Monta o view-model da visão Analítico a partir dos dados já carregados.
 *
 * @param params Dados, janela e seleção atuais.
 * @returns View-model da visão Analítico.
 */
export const buildAnalytics = (params: AnalyticsParams): AnalyticsViewModel => {
  const windowMonths = params.windowMonths ?? 6;
  const topCount = params.topCount ?? 7;
  const scoped = filterByCard(params.transactions, params.cardId);
  const months = billMonthsWindow(params.month, windowMonths);

  const monthTxs = filterByBillMonth(scoped, params.month);
  const previousTxs = filterByBillMonth(scoped, shiftMonthKey(params.month, -1));
  const billTotal = sumAmount(monthTxs);
  const variation = monthVariation(billTotal, sumAmount(previousTxs));

  const categories = groupByCategory(monthTxs, params.tags);
  const top = categories[0];
  const topCategory: TopCategoryVM | null = top
    ? { name: top.name, color: top.color, total: top.total }
    : null;

  const scopedCards = params.cardId
    ? params.cards.filter((card) => card.id === params.cardId)
    : params.cards;

  const tagById = new Map(params.tags.map((tag) => [tag.id, tag]));
  const cardNameById = new Map(
    params.cards.map((card) => [card.id, card.name]),
  );
  const topList = topTransactions(monthTxs, topCount);
  const topRows: TopRow[] = topList.map((tx) => {
    const tag = tx.tagId ? tagById.get(tx.tagId) ?? null : null;
    return {
      id: tx.id,
      title: tx.title,
      amount: tx.amount,
      isInstallment: tx.isInstallment,
      installmentCount: tx.installmentCount,
      purchaseDate: tx.purchaseDate,
      categoryName: tag?.name ?? NO_CATEGORY_LABEL,
      categoryColor: tx.tagId
        ? resolveCategoryColor({ id: tx.tagId, color: tag?.color })
        : NO_CATEGORY_COLOR,
      cardName: tx.creditCardId
        ? cardNameById.get(tx.creditCardId) ?? "Cartão"
        : "—",
    };
  });

  return {
    month: params.month,
    cardId: params.cardId,
    kpis: {
      billTotal,
      variation,
      topCategory,
      limitUsedPct: computeLimitUsedPct(params, billTotal, scopedCards),
    },
    monthlySeries: buildMonthlySeriesByCard(scoped, scopedCards, months),
    categories,
    cardTotals: cardBreakdown(monthTxs, params.cards),
    topTransactions: topList,
    topRows,
  };
};
