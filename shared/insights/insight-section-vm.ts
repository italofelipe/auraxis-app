import type {
  InsightSectionSource,
  InsightSectionVM,
} from "@/shared/insights/insight-section-contracts";

/**
 * Default number of highlights surfaced in the compact section. The recorte
 * keeps it short (lead + one or two destaques) — the full reading carries the
 * rest.
 */
export const INSIGHT_SECTION_DEFAULT_MAX_HIGHLIGHTS = 2;

export interface ToInsightSectionVMOptions {
  /** Cap on how many highlights to keep (default {@link INSIGHT_SECTION_DEFAULT_MAX_HIGHLIGHTS}). */
  readonly maxHighlights?: number;
}

/**
 * Condenses a full insight source (the Fluida VM is assignable) into the
 * compact {@link InsightSectionVM} shown on each feature page: it keeps the
 * lead identity (dimension, severity, title, lead) and trims the highlights to
 * the first one or two so the section stays a recorte, not the full reading.
 *
 * Pure and side-effect free — the source array is sliced, never mutated.
 *
 * @param source Full insight source for a single dimension.
 * @param options Optional highlight cap.
 * @returns The compact section view model.
 */
export const toInsightSectionVM = (
  source: InsightSectionSource,
  options: ToInsightSectionVMOptions = {},
): InsightSectionVM => {
  const maxHighlights =
    options.maxHighlights ?? INSIGHT_SECTION_DEFAULT_MAX_HIGHLIGHTS;

  return {
    dimension: source.dimension,
    severity: source.severity,
    title: source.title,
    lead: source.lead,
    highlights: source.highlights.slice(0, Math.max(0, maxHighlights)),
  };
};
