/**
 * View-model puro da visão "Faturas" de cartões (total, status, datas do ciclo,
 * categorias, tendência mensal, utilização e rail por cartão).
 *
 * Portado das funções puras e testadas do auraxis-web
 * (`app/features/credit-cards/model/credit-card-statement.ts`), adaptado para os
 * contratos camelCase do app (`CreditCard`, `CreditCardBillRecord`,
 * `CreditCardUtilizationRecord`, `Tag`). Reutiliza `billing-month.ts` para o
 * cálculo de meses. Sem dependência de UI ou framework.
 */

import type {
  CreditCard,
  CreditCardBillRecord,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import type { Tag } from "@/features/tags/contracts";

import {
  billMonthsWindow,
  monthKeyLabel,
  monthKeyShort,
} from "./billing-month";
import {
  type EnrichedTransaction,
  resolveCardCycleForMonth,
} from "./card-transactions";
import {
  type CardTotal,
  type CategoryGroup,
  cardBreakdown,
  filterByBillMonth,
  filterByCard,
  groupByCategory,
  sumAmount,
} from "./credit-card-aggregation";

/** Pílula de status da fatura. */
export interface BillStatusVM {
  readonly label: string;
  readonly tone: "open" | "closed";
}

/** Ponto da mini-série de faturas anteriores. */
export interface MonthlyTrendPoint {
  readonly month: string;
  readonly label: string;
  readonly total: number;
  readonly current: boolean;
}

/** View-model completo da visão Faturas. */
export interface StatementViewModel {
  readonly month: string;
  readonly monthLabel: string;
  readonly cardId: string | null;
  readonly total: number;
  readonly itemCount: number;
  readonly status: BillStatusVM | null;
  readonly closingDate: string | null;
  readonly dueDate: string | null;
  readonly categories: readonly CategoryGroup[];
  readonly monthlyTrend: readonly MonthlyTrendPoint[];
  readonly utilizationPct: number | null;
  readonly limitAmount: number | null;
  /** Total da fatura do mês por cartão (todos os cartões, ignora o filtro). */
  readonly railTotals: readonly CardTotal[];
  /** Total do mês somando todos os cartões (para o item "Todos" do rail). */
  readonly allCardsTotal: number;
}

/** Parâmetros para montar a visão Faturas. */
export interface StatementParams {
  readonly transactions: readonly EnrichedTransaction[];
  readonly tags: readonly Tag[];
  readonly cards: readonly CreditCard[];
  readonly month: string;
  readonly cardId: string | null;
  /** Fatura oficial do backend (apenas para cartão único). */
  readonly bill?: CreditCardBillRecord | null;
  /** Utilização oficial do backend (apenas para cartão único). */
  readonly utilization?: CreditCardUtilizationRecord | null;
  /** Quantidade de meses na mini-série de tendência (default 6). */
  readonly trendMonths?: number;
}

/** Ciclo resolvido da fatura (datas + status). */
interface CycleInfo {
  readonly closingDate: string | null;
  readonly dueDate: string | null;
  readonly status: BillStatusVM | null;
}

/**
 * Converte o status cru do ciclo (open/closed/...) na pílula da fatura.
 *
 * @param status Status cru do backend.
 * @returns Pílula de status, ou null quando ausente.
 */
const statusFromCycleStatus = (
  status: string | undefined,
): BillStatusVM | null => {
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
 * Soma os limites dos cartões (ignora limites nulos).
 *
 * @param cards Cartões.
 * @returns Soma dos limites, ou null quando nenhum tem limite.
 */
const sumLimits = (cards: readonly CreditCard[]): number | null => {
  const withLimit = cards.filter((card) => card.limitAmount !== null);
  if (withLimit.length === 0) {
    return null;
  }
  return withLimit.reduce((sum, card) => sum + (card.limitAmount ?? 0), 0);
};

/**
 * Menor data de vencimento (próximo vencimento) entre os cartões no mês.
 *
 * @param cards Cartões.
 * @param month Mês de fatura (`YYYY-MM`).
 * @returns Data `YYYY-MM-DD` do vencimento mais próximo, ou null.
 */
const consolidatedDueDate = (
  cards: readonly CreditCard[],
  month: string,
): string | null => {
  const dueDates = cards
    .map((card) => resolveCardCycleForMonth(card, month)?.dueDate)
    .filter((value): value is string => Boolean(value))
    .sort();
  return dueDates[0] ?? null;
};

/** Preview de ciclo (subconjunto usado aqui). */
type Cycle = { readonly closingDate: string; readonly dueDate: string } | null;

/**
 * Escolhe a data de fechamento (fatura oficial > ciclo derivado > null).
 *
 * @param bill Fatura oficial.
 * @param derived Ciclo derivado.
 * @returns Data de fechamento ou null.
 */
const pickClosingDate = (
  bill: CreditCardBillRecord | null,
  derived: Cycle,
): string | null => {
  if (bill) {
    return bill.cycle.endDate;
  }
  return derived ? derived.closingDate : null;
};

/**
 * Escolhe a data de vencimento (fatura oficial > ciclo derivado > null).
 *
 * @param bill Fatura oficial.
 * @param derived Ciclo derivado.
 * @returns Data de vencimento ou null.
 */
const pickDueDate = (
  bill: CreditCardBillRecord | null,
  derived: Cycle,
): string | null => {
  if (bill) {
    return bill.cycle.dueDate;
  }
  return derived ? derived.dueDate : null;
};

/**
 * Resolve datas de fechamento/vencimento e status da fatura.
 *
 * @param params Parâmetros da visão.
 * @param card Cartão selecionado (ou null no consolidado).
 * @param bill Fatura oficial (cartão único).
 * @returns Datas e status resolvidos.
 */
const resolveStatementCycle = (
  params: StatementParams,
  card: CreditCard | null,
  bill: CreditCardBillRecord | null,
): CycleInfo => {
  const isSingleCard = params.cardId !== null;
  const derived = card ? resolveCardCycleForMonth(card, params.month) : null;
  return {
    closingDate: pickClosingDate(bill, derived),
    dueDate: isSingleCard
      ? pickDueDate(bill, derived)
      : consolidatedDueDate(params.cards, params.month),
    status: isSingleCard ? statusFromCycleStatus(bill?.cycle.status) : null,
  };
};

/**
 * Resolve o percentual de utilização (oficial para cartão único; derivado no
 * consolidado).
 *
 * @param params Parâmetros da visão.
 * @param limitAmount Limite agregado.
 * @param aggregatedTotal Total agregado do mês.
 * @returns Percentual de utilização ou null.
 */
const resolveStatementUtilization = (
  params: StatementParams,
  limitAmount: number | null,
  aggregatedTotal: number,
): number | null => {
  if (params.cardId !== null) {
    return params.utilization?.utilizationPct ?? null;
  }
  if (limitAmount && limitAmount > 0) {
    return (aggregatedTotal / limitAmount) * 100;
  }
  return null;
};

/**
 * Monta o view-model da visão Faturas a partir dos dados já carregados.
 *
 * Para cartão único usa os números oficiais da fatura/utilização do backend;
 * para o consolidado ("Todos") agrega as transações da janela.
 *
 * @param params Dados e seleção atuais.
 * @returns View-model da visão Faturas.
 */
export const buildStatement = (params: StatementParams): StatementViewModel => {
  const trendMonths = params.trendMonths ?? 6;
  const scoped = filterByCard(params.transactions, params.cardId);
  const monthTxs = filterByBillMonth(scoped, params.month);
  const aggregatedTotal = sumAmount(monthTxs);

  const isSingleCard = params.cardId !== null;
  const card = isSingleCard
    ? params.cards.find((entry) => entry.id === params.cardId) ?? null
    : null;
  const bill = isSingleCard ? params.bill ?? null : null;

  const cycle = resolveStatementCycle(params, card, bill);
  const limitAmount = isSingleCard
    ? card?.limitAmount ?? null
    : sumLimits(params.cards);
  const allMonthTxs = filterByBillMonth(params.transactions, params.month);

  const monthlyTrend = billMonthsWindow(params.month, trendMonths).map(
    (monthKey) => ({
      month: monthKey,
      label: monthKeyShort(monthKey),
      total: sumAmount(filterByBillMonth(scoped, monthKey)),
      current: monthKey === params.month,
    }),
  );

  return {
    month: params.month,
    monthLabel: monthKeyLabel(params.month),
    cardId: params.cardId,
    total: bill ? bill.totalAmount : aggregatedTotal,
    itemCount: bill ? bill.transactions.length : monthTxs.length,
    status: cycle.status,
    closingDate: cycle.closingDate,
    dueDate: cycle.dueDate,
    categories: groupByCategory(monthTxs, params.tags),
    monthlyTrend,
    utilizationPct: resolveStatementUtilization(
      params,
      limitAmount,
      aggregatedTotal,
    ),
    limitAmount,
    railTotals: cardBreakdown(allMonthTxs, params.cards),
    allCardsTotal: sumAmount(allMonthTxs),
  };
};
