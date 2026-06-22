import { useMemo } from "react";

import type { InsightDimension } from "@/features/insights/contracts";
import { insightToFluidaVM } from "@/features/insights/fluida/insight-to-fluida-vm";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";
import { AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY } from "@/features/insights/insights-config";
import { isFeatureEnabled } from "@/shared/feature-flags";
import {
  INSIGHT_SECTION_DIMENSIONS,
  type InsightSectionVM,
} from "@/shared/insights/insight-section-contracts";
import { toInsightSectionVM } from "@/shared/insights/insight-section-vm";

/**
 * Normalises an arbitrary dimension hint coming from a feature page (which may
 * pass a value with no mobile recorte yet, such as `wallet`) onto a known
 * {@link InsightDimension}, falling back to `general`.
 *
 * @param dimension Raw dimension hint from the feature screen.
 * @returns A dimension present in the mobile contract.
 */
const resolveSectionDimension = (dimension: string): InsightDimension => {
  return (INSIGHT_SECTION_DIMENSIONS as readonly string[]).includes(dimension)
    ? (dimension as InsightDimension)
    : "general";
};

/**
 * Reusable insights selector that feeds the per-feature "Insights de IA"
 * section. Gated by the `app.insights.fluida` flag: returns `null` when the
 * flag is OFF (the feature page then renders no section). When ON, it derives
 * the daily Fluida VM for the requested dimension from the **real** latest
 * insight ({@link useWeeklyInsight}) and condenses it into the compact
 * {@link InsightSectionVM} (lead + at most two highlights).
 *
 * The derivation goes through {@link insightToFluidaVM}, which falls back to the
 * mock fixture when the insight is absent or lacks the additive structured
 * fields — so the section is never empty while the backend rolls out.
 *
 * Lives in `features/insights` (the cross-cutting insights provider) on
 * purpose: the section UI is the shared, reusable piece — the data seam stays
 * next to the insights provider so the shared component never depends on a
 * feature.
 *
 * @param dimension Feature dimension to slice (e.g. `transactions`, `goals`).
 * @returns The compact section VM, or `null` when the flag is OFF.
 */
export const useInsightSection = (
  dimension: string,
): InsightSectionVM | null => {
  const enabled = isFeatureEnabled(AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY);
  const { insight } = useWeeklyInsight({ enabled });

  return useMemo<InsightSectionVM | null>(() => {
    if (!enabled) {
      return null;
    }

    const resolved = resolveSectionDimension(dimension);
    const fullVM = insightToFluidaVM(insight, {
      dimension: resolved,
      cadence: "daily",
    });
    return toInsightSectionVM(fullVM);
  }, [dimension, enabled, insight]);
};
