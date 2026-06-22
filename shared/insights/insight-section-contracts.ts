/**
 * Insight dimension as far as the **compact section** is concerned. Mirrors
 * the mobile `InsightDimension` enum (`features/insights/contracts`) as a
 * self-contained literal union so this shared module owns no dependency on
 * any feature — the insights selector that feeds the section maps the real
 * enum onto this type, and the two unions are structurally identical.
 *
 * Note: the product handoff lists a `wallet` recorte, but `wallet` is not a
 * dimension in the mobile contract (it only exists on the web side). The
 * Carteira screen therefore falls back to `general` until the backend ships
 * a wallet slice.
 */
export type InsightSectionDimension =
  | "general"
  | "transactions"
  | "credit_cards"
  | "goals"
  | "budgets";

/**
 * Canonical list of section dimensions, used to validate route params and to
 * drive parametrised tests.
 */
export const INSIGHT_SECTION_DIMENSIONS: readonly InsightSectionDimension[] = [
  "general",
  "transactions",
  "credit_cards",
  "goals",
  "budgets",
];

/**
 * Human-readable kicker label per dimension, shown above the section
 * headline. Self-contained here (mirrors `getInsightDimensionLabel` from
 * `features/insights`) so this shared module owns no feature dependency.
 */
const INSIGHT_SECTION_DIMENSION_LABELS: Record<InsightSectionDimension, string> = {
  general: "Visao geral",
  transactions: "Transacoes",
  credit_cards: "Cartoes",
  goals: "Metas",
  budgets: "Orcamentos",
};

/**
 * Returns the kicker label for a section dimension.
 *
 * @param dimension Section dimension.
 * @returns Localised dimension label.
 */
export const getInsightSectionDimensionLabel = (
  dimension: InsightSectionDimension,
): string => {
  return INSIGHT_SECTION_DIMENSION_LABELS[dimension];
};

/**
 * Editorial severity of a section lead. Identical to the Fluida
 * `InsightSeverity` so the full VM is assignable to {@link InsightSectionSource}.
 */
export type InsightSectionSeverity = "ok" | "attention" | "alert";

/**
 * One numeric highlight tile shown inside the compact section: a short label,
 * a value and a one-line sub-caption.
 */
export interface InsightSectionHighlight {
  readonly label: string;
  readonly value: string;
  readonly sub: string;
}

/**
 * Structural input accepted by {@link toInsightSectionVM}. Declared with only
 * the fields the section needs so the full Fluida VM
 * (`InsightFluidaVM`) is assignable to it without this shared module
 * importing the feature contract. Keeps the dependency arrow pointing the
 * right way (feature → shared, never shared → feature).
 */
export interface InsightSectionSource {
  readonly dimension: InsightSectionDimension;
  readonly severity: InsightSectionSeverity;
  readonly title: string;
  readonly lead: string;
  readonly highlights: readonly InsightSectionHighlight[];
}

/**
 * Compact view model for the per-feature "Insights de IA" section: the
 * editorial recorte of a single dimension — severity + headline, a short lead
 * and one or two highlights — plus a CTA that opens the full Fluida reading on
 * that theme.
 */
export interface InsightSectionVM {
  readonly dimension: InsightSectionDimension;
  readonly severity: InsightSectionSeverity;
  readonly title: string;
  readonly lead: string;
  readonly highlights: readonly InsightSectionHighlight[];
}
