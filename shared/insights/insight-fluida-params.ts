import type { Href } from "expo-router";

import { appRoutes } from "@/core/navigation/routes";
import {
  INSIGHT_SECTION_DIMENSIONS,
  type InsightSectionDimension,
} from "@/shared/insights/insight-section-contracts";

export { INSIGHT_SECTION_DIMENSIONS };

/**
 * Query-param key carrying the pre-selected dimension into the Fluida screen.
 */
export const INSIGHT_DIMENSION_PARAM = "dimension";

/**
 * Builds the Expo Router target that opens the full "Fluida" reading already
 * focused on a given dimension (e.g. `/insights?dimension=transactions`). Used
 * by the per-feature "ler na íntegra" CTA.
 *
 * @param dimension Dimension to pre-select on the Fluida screen.
 * @returns An Expo Router `Href` to the insights route with the dimension param.
 */
export const buildInsightFluidaParams = (
  dimension: InsightSectionDimension,
): Href => ({
  pathname: appRoutes.private.insights,
  params: { [INSIGHT_DIMENSION_PARAM]: dimension },
});

const isInsightSectionDimension = (
  value: string,
): value is InsightSectionDimension => {
  return (INSIGHT_SECTION_DIMENSIONS as readonly string[]).includes(value);
};

/**
 * Parses the raw `dimension` route param (Expo Router yields a string, a
 * string array or `undefined`) into a validated {@link InsightSectionDimension},
 * or `undefined` when absent/unknown — so the Fluida screen can fall back to
 * its default dimension.
 *
 * @param raw Raw param value from `useLocalSearchParams`.
 * @returns The matching dimension, or `undefined`.
 */
export const parseInsightDimensionParam = (
  raw: string | readonly string[] | undefined,
): InsightSectionDimension | undefined => {
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return isInsightSectionDimension(value) ? value : undefined;
};
