/**
 * Agregações puras de transações de cartão (totais por categoria, por cartão,
 * série mensal, top-N e variação mês a mês).
 *
 * Portado das funções puras e testadas do auraxis-web
 * (`app/features/credit-cards/model/credit-card-aggregation.ts`), adaptado para
 * os contratos camelCase do app (`Tag`, `CreditCard`). Sem dependência de UI ou
 * framework.
 */

import type { CreditCard } from "@/features/credit-cards/contracts";
import type { Tag } from "@/features/tags/contracts";
import { NO_CATEGORY_COLOR, resolveCategoryColor } from "@/shared/theme";

import type { EnrichedTransaction } from "./card-transactions";

/** Rótulo usado para transações sem categoria. */
export const NO_CATEGORY_LABEL = "Sem categoria";

/** Agregado de gastos por categoria (tag). */
export interface CategoryGroup {
  readonly tagId: string | null;
  readonly name: string;
  readonly color: string;
  readonly total: number;
  readonly count: number;
  readonly items: readonly EnrichedTransaction[];
}

/** Total de gastos por cartão. */
export interface CardTotal {
  readonly cardId: string;
  readonly name: string;
  readonly total: number;
}

/** Série mensal empilhada por cartão (para barras empilhadas). */
export interface MonthlyCardSeries {
  readonly months: readonly string[];
  readonly series: readonly {
    readonly cardId: string;
    readonly name: string;
    readonly values: number[];
  }[];
}

/** Variação de um mês contra o anterior. */
export interface MonthVariation {
  /** current - previous. */
  readonly delta: number;
  /** Variação percentual; null quando o mês anterior é zero (sem base). */
  readonly pct: number | null;
}

/**
 * Soma o valor de uma lista de transações.
 *
 * @param transactions Transações enriquecidas.
 * @returns Soma dos valores.
 */
export const sumAmount = (
  transactions: readonly EnrichedTransaction[],
): number => transactions.reduce((sum, tx) => sum + tx.amount, 0);

/**
 * Filtra transações pelo mês de fatura.
 *
 * @param transactions Transações enriquecidas.
 * @param month Mês de fatura (`YYYY-MM`).
 * @returns Transações cuja fatura cai no mês.
 */
export const filterByBillMonth = (
  transactions: readonly EnrichedTransaction[],
  month: string,
): EnrichedTransaction[] =>
  transactions.filter((tx) => tx.billMonth === month);

/**
 * Filtra transações por cartão. Quando `cardId` é null, retorna todas.
 *
 * @param transactions Transações enriquecidas.
 * @param cardId Cartão alvo, ou null para "Todos".
 * @returns Transações do cartão (ou todas).
 */
export const filterByCard = (
  transactions: readonly EnrichedTransaction[],
  cardId: string | null,
): EnrichedTransaction[] =>
  cardId === null
    ? transactions.slice()
    : transactions.filter((tx) => tx.creditCardId === cardId);

/**
 * Agrupa transações por categoria, juntando nome e cor da tag, ordenado por
 * total decrescente. A cor de fallback é estável (índice da tag na lista).
 *
 * @param transactions Transações enriquecidas.
 * @param tags Categorias do usuário.
 * @returns Grupos por categoria, do maior para o menor total.
 */
export const groupByCategory = (
  transactions: readonly EnrichedTransaction[],
  tags: readonly Tag[],
): CategoryGroup[] => {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const buckets = new Map<string | null, EnrichedTransaction[]>();

  for (const tx of transactions) {
    const bucket = buckets.get(tx.tagId) ?? [];
    bucket.push(tx);
    buckets.set(tx.tagId, bucket);
  }

  const groups: CategoryGroup[] = [];
  for (const [tagId, items] of buckets) {
    const tag = tagId ? tagById.get(tagId) ?? null : null;
    groups.push({
      tagId,
      name: tag?.name ?? NO_CATEGORY_LABEL,
      color: tagId
        ? resolveCategoryColor({ id: tagId, color: tag?.color })
        : NO_CATEGORY_COLOR,
      total: sumAmount(items),
      count: items.length,
      items,
    });
  }

  return groups.sort((a, b) => b.total - a.total);
};

/**
 * Total de gastos por cartão, ordenado decrescente.
 *
 * @param transactions Transações enriquecidas.
 * @param cards Cartões do usuário (para o nome).
 * @returns Totais por cartão.
 */
export const cardBreakdown = (
  transactions: readonly EnrichedTransaction[],
  cards: readonly CreditCard[],
): CardTotal[] => {
  const nameById = new Map(cards.map((card) => [card.id, card.name]));
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    if (!tx.creditCardId) {
      continue;
    }
    totals.set(
      tx.creditCardId,
      (totals.get(tx.creditCardId) ?? 0) + tx.amount,
    );
  }

  return [...totals.entries()]
    .map(([cardId, total]) => ({
      cardId,
      name: nameById.get(cardId) ?? "Cartão",
      total,
    }))
    .sort((a, b) => b.total - a.total);
};

/**
 * Constrói a matriz de gastos por (mês × cartão) para barras empilhadas.
 *
 * @param transactions Transações enriquecidas.
 * @param cards Cartões do usuário.
 * @param months Janela de meses (`YYYY-MM`) crescente.
 * @returns Série mensal por cartão.
 */
export const buildMonthlySeriesByCard = (
  transactions: readonly EnrichedTransaction[],
  cards: readonly CreditCard[],
  months: readonly string[],
): MonthlyCardSeries => {
  const monthPosition = new Map(months.map((month, index) => [month, index]));
  const series = cards.map((card) => ({
    cardId: card.id,
    name: card.name,
    values: months.map(() => 0),
  }));
  const seriesByCard = new Map(series.map((entry) => [entry.cardId, entry]));

  for (const tx of transactions) {
    if (!tx.creditCardId || tx.billMonth === null) {
      continue;
    }
    const position = monthPosition.get(tx.billMonth);
    if (position === undefined) {
      continue;
    }
    const entry = seriesByCard.get(tx.creditCardId);
    if (entry) {
      entry.values[position] = (entry.values[position] ?? 0) + tx.amount;
    }
  }

  return { months: [...months], series };
};

/**
 * Top-N transações por valor (decrescente).
 *
 * @param transactions Transações enriquecidas.
 * @param limit Quantidade máxima.
 * @returns Maiores lançamentos.
 */
export const topTransactions = (
  transactions: readonly EnrichedTransaction[],
  limit: number,
): EnrichedTransaction[] =>
  [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, Math.max(0, limit));

/**
 * Variação entre o total do mês e o do mês anterior.
 *
 * @param current Total do mês atual.
 * @param previous Total do mês anterior.
 * @returns Delta absoluto e percentual (null sem base).
 */
export const monthVariation = (
  current: number,
  previous: number,
): MonthVariation => {
  const delta = current - previous;
  const pct = previous === 0 ? null : (delta / previous) * 100;
  return { delta, pct };
};
