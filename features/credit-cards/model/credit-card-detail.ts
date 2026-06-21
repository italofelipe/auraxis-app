/**
 * View-model puro da tela "Detalhe do cartão": subtítulo, bloco de limite (anel
 * + total/disponível/fatura atual), série de evolução da fatura, principais
 * categorias e lançamentos recentes — para um único cartão.
 *
 * Reaproveita as agregações puras já testadas (`credit-card-aggregation`,
 * `billing-month`) e o token de gradiente de marca. Sem dependência de UI: a
 * tela recebe este view-model e só renderiza.
 */

import type {
  CreditCard,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import type { Tag } from "@/features/tags/contracts";
import { resolveCardGradient, type GradientStops } from "@/shared/theme";

import { billMonthsWindow, monthKeyShort } from "./billing-month";
import type { EnrichedTransaction } from "./card-transactions";
import {
  type CategoryGroup,
  filterByBillMonth,
  groupByCategory,
  sumAmount,
} from "./credit-card-aggregation";

/** Limiar de utilização (%) acima do qual o anel fica em tom de perigo. */
export const DETAIL_LIMIT_DANGER_THRESHOLD = 85;

/** Tom do anel de limite, derivado do percentual de uso. */
export type LimitRingTone = "primary" | "danger";

/** Ponto da série de evolução da fatura (mês + total). */
export interface DetailEvolutionPoint {
  /** Abreviação do mês ("Jun"). */
  readonly label: string;
  /** Total da fatura do mês. */
  readonly value: number;
}

/** Bloco de limite: anel + linhas (total, disponível, fatura atual). */
export interface CreditCardLimitBlock {
  /** Percentual de uso do limite (0–100). */
  readonly usedPct: number;
  /** Limite total do cartão, ou null quando não informado. */
  readonly limitAmount: number | null;
  /** Valor disponível, ou null quando não há base de limite. */
  readonly availableAmount: number | null;
  /** Total da fatura atual (comprometido no ciclo). */
  readonly currentBillTotal: number;
  /** Tom do anel (primary/danger). */
  readonly tone: LimitRingTone;
}

/** View-model completo da tela "Detalhe do cartão". */
export interface CreditCardDetailViewModel {
  /** Subtítulo da AppBar ("{emissor} · {bandeira}"). */
  readonly subtitle: string;
  /** Gradiente de marca da face do cartão. */
  readonly gradient: GradientStops;
  /** Total da fatura atual do cartão. */
  readonly currentBillTotal: number;
  /** Bloco de limite (anel + linhas). */
  readonly limit: CreditCardLimitBlock;
  /** Série de evolução da fatura (mais antigo → mais recente). */
  readonly evolution: readonly DetailEvolutionPoint[];
  /** Principais categorias do mês (ordenadas por total desc). */
  readonly topCategories: readonly CategoryGroup[];
  /** Lançamentos recentes do mês (mais novos primeiro). */
  readonly recentTransactions: readonly EnrichedTransaction[];
}

/** Parâmetros para montar o view-model do detalhe do cartão. */
export interface CreditCardDetailParams {
  readonly card: CreditCard;
  /** Transações já enriquecidas e escopadas a este cartão. */
  readonly transactions: readonly EnrichedTransaction[];
  readonly tags: readonly Tag[];
  /** Utilização oficial do backend (preferida quando presente). */
  readonly utilization?: CreditCardUtilizationRecord | null;
  /** Mês de fatura atual (`YYYY-MM`). */
  readonly month: string;
  /** Quantidade de meses na série de evolução (default 7). */
  readonly windowMonths?: number;
}

/**
 * Monta o subtítulo "{emissor} · {bandeira}", omitindo as partes ausentes.
 *
 * @param card Cartão.
 * @returns Subtítulo humano, ou "Cartão de crédito" quando faltam ambos.
 */
const buildSubtitle = (card: CreditCard): string => {
  const parts = [card.bank, card.brand].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(" · ") : "Cartão de crédito";
};

const clampPct = (value: number): number =>
  Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

/**
 * Resolve o percentual de uso preferindo o oficial e caindo para `comprometido /
 * limite`.
 *
 * @param officialPct Percentual oficial (pode ser null/undefined).
 * @param committed Valor comprometido no ciclo.
 * @param limitAmount Limite, ou null.
 * @returns Percentual de uso (0–100).
 */
const resolveUsedPct = (
  officialPct: number | null | undefined,
  committed: number,
  limitAmount: number | null,
): number => {
  if (officialPct !== null && officialPct !== undefined) {
    return clampPct(officialPct);
  }
  if (limitAmount && limitAmount > 0) {
    return clampPct((committed / limitAmount) * 100);
  }
  return 0;
};

/**
 * Resolve o bloco de limite preferindo os números oficiais de utilização e
 * caindo para uma derivação a partir das transações do mês.
 *
 * @param params Parâmetros do view-model.
 * @param currentBillTotal Total derivado das transações do mês (fallback).
 * @returns Bloco de limite (anel + linhas).
 */
const resolveLimitBlock = (
  params: CreditCardDetailParams,
  currentBillTotal: number,
): CreditCardLimitBlock => {
  const { card, utilization } = params;
  const limitAmount = utilization?.limitAmount ?? card.limitAmount ?? null;
  const committed = utilization ? utilization.committedAmount : currentBillTotal;
  const usedPct = resolveUsedPct(
    utilization?.utilizationPct,
    committed,
    limitAmount,
  );
  const availableAmount =
    utilization?.availableAmount ??
    (limitAmount !== null ? limitAmount - committed : null);

  return {
    usedPct,
    limitAmount,
    availableAmount,
    currentBillTotal: committed,
    tone: usedPct >= DETAIL_LIMIT_DANGER_THRESHOLD ? "danger" : "primary",
  };
};

/**
 * Monta o view-model da tela "Detalhe do cartão" a partir dos dados carregados.
 *
 * @param params Cartão, transações escopadas, tags, utilização e mês.
 * @returns View-model do detalhe do cartão.
 */
export const buildCreditCardDetailViewModel = (
  params: CreditCardDetailParams,
): CreditCardDetailViewModel => {
  const windowMonths = params.windowMonths ?? 7;
  const monthTxs = filterByBillMonth(params.transactions, params.month);
  const derivedBillTotal = sumAmount(monthTxs);

  const limit = resolveLimitBlock(params, derivedBillTotal);
  const evolution = billMonthsWindow(params.month, windowMonths).map(
    (monthKey) => ({
      label: monthKeyShort(monthKey),
      value: sumAmount(filterByBillMonth(params.transactions, monthKey)),
    }),
  );
  const recentTransactions = [...monthTxs].sort((left, right) =>
    right.purchaseDate.localeCompare(left.purchaseDate),
  );

  return {
    subtitle: buildSubtitle(params.card),
    gradient: resolveCardGradient({
      id: params.card.id,
      bank: params.card.bank,
      name: params.card.name,
    }),
    currentBillTotal: limit.currentBillTotal,
    limit,
    evolution,
    topCategories: groupByCategory(monthTxs, params.tags),
    recentTransactions,
  };
};
