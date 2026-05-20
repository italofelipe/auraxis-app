import { useMemo } from "react";

import type {
  InsightDimension,
  InsightItem,
} from "@/features/insights/contracts";

export interface InsightDimensionGroup {
  readonly dimension: InsightDimension;
  readonly label: string;
  readonly items: readonly InsightItem[];
}

export const INSIGHT_DIMENSION_ORDER: readonly InsightDimension[] = [
  "general",
  "transactions",
  "credit_cards",
  "goals",
  "budgets",
];

const INSIGHT_DIMENSION_LABELS: Record<InsightDimension, string> = {
  general: "Visao geral",
  transactions: "Transacoes",
  credit_cards: "Cartoes",
  goals: "Metas",
  budgets: "Orcamentos",
};

export const getInsightDimensionLabel = (dimension: InsightDimension): string => {
  return INSIGHT_DIMENSION_LABELS[dimension];
};

export const normalizeInsightDimension = (
  dimension: InsightItem["dimension"],
): InsightDimension => {
  return INSIGHT_DIMENSION_ORDER.includes(dimension as InsightDimension)
    ? (dimension as InsightDimension)
    : "general";
};

export const normalizeInsightItemDimension = (item: InsightItem): InsightItem => ({
  ...item,
  dimension: normalizeInsightDimension(item.dimension),
});

export const filterInsightItemsByDimension = (
  items: readonly InsightItem[],
  dimension: InsightDimension,
): readonly InsightItem[] => {
  return items
    .map(normalizeInsightItemDimension)
    .filter((item) => item.dimension === "general" || item.dimension === dimension);
};

export const groupInsightItemsByDimension = (
  items: readonly InsightItem[],
): readonly InsightDimensionGroup[] => {
  const normalized = items.map(normalizeInsightItemDimension);

  return INSIGHT_DIMENSION_ORDER.map((dimension) => ({
    dimension,
    label: getInsightDimensionLabel(dimension),
    items: normalized.filter((item) => item.dimension === dimension),
  })).filter((group) => group.items.length > 0);
};

export const useInsightsByDimension = (
  items: readonly InsightItem[],
  dimension: InsightDimension,
): readonly InsightItem[] => {
  return useMemo(
    () => filterInsightItemsByDimension(items, dimension),
    [dimension, items],
  );
};
