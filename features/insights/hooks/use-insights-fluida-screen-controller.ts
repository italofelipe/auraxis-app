import { useCallback, useMemo, useState } from "react";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import type { InsightDimension } from "@/features/insights/contracts";
import type {
  InsightCadence,
  InsightFluidaVM,
} from "@/features/insights/fluida/contracts";
import { insightToFluidaVM } from "@/features/insights/fluida/insight-to-fluida-vm";
import { getInsightDimensionLabel } from "@/features/insights/hooks/use-insights-by-dimension";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";

/**
 * A selectable theme tab in the masthead (one per insight dimension).
 */
export interface InsightDimensionTab {
  readonly value: InsightDimension;
  readonly label: string;
}

/**
 * A selectable cadence option in the masthead toggle.
 */
export interface InsightCadenceOption {
  readonly value: InsightCadence;
  readonly label: string;
}

export interface UseInsightsFluidaScreenControllerOptions {
  /**
   * Dimension to pre-select on mount, e.g. when the screen is opened from a
   * feature page's "ler na íntegra" CTA (`/insights?dimension=goals`).
   * Defaults to `general` when omitted.
   */
  readonly initialDimension?: InsightDimension;
}

export interface InsightsFluidaScreenController {
  readonly cadence: InsightCadence;
  readonly dimension: InsightDimension;
  readonly vm: InsightFluidaVM;
  /** Whether the "Como se compara" beat renders (general dimension only). */
  readonly showCompare: boolean;
  readonly isDark: boolean;
  readonly cadenceOptions: readonly InsightCadenceOption[];
  readonly dimensionTabs: readonly InsightDimensionTab[];
  readonly selectCadence: (cadence: InsightCadence) => void;
  readonly selectDimension: (dimension: InsightDimension) => void;
  readonly toggleTheme: () => void;
}

/**
 * Reading order of the theme tabs in the masthead — follows the design
 * handoff (Geral · Transações · Metas · Orçamentos · Cartões), which
 * differs from the API dimension order.
 */
const DIMENSION_TAB_ORDER: readonly InsightDimension[] = [
  "general",
  "transactions",
  "goals",
  "budgets",
  "credit_cards",
];

const CADENCE_OPTIONS: readonly InsightCadenceOption[] = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
];

/**
 * Screen controller for the "Fluida" insights screen (etapa 1 + 2). Owns the
 * selected cadence and dimension, derives the full reading VM from the **real**
 * insight (the latest AI insight loaded via {@link useWeeklyInsight}), flags
 * whether the comparative beat applies (general only), and bridges the
 * light/dark toggle to the app shell theme preference. View-only components
 * consume this; no business logic lives in the screen itself.
 *
 * The VM is derived by {@link insightToFluidaVM}, which falls back to the mock
 * fixture when the insight is absent (404 / not yet loaded) or lacks the
 * additive structured fields (`paragraphs`/`retro`/`series`/`highlights` —
 * backend not yet deployed). The screen is therefore never empty.
 *
 * @param options Optional initial dimension (e.g. from a deep link).
 * @returns The derived state and handlers for the Fluida screen.
 */
export const useInsightsFluidaScreenController = (
  options: UseInsightsFluidaScreenControllerOptions = {},
): InsightsFluidaScreenController => {
    const [cadence, setCadence] = useState<InsightCadence>("daily");
    const [dimension, setDimension] = useState<InsightDimension>(
      options.initialDimension ?? "general",
    );
    const resolvedTheme = useResolvedTheme();
    const isDark = resolvedTheme === "auraxis_dark";

    const { insight } = useWeeklyInsight();

    const vm = useMemo(
      () => insightToFluidaVM(insight, { dimension, cadence }),
      [insight, cadence, dimension],
    );
    const showCompare = dimension === "general";

    const dimensionTabs = useMemo<readonly InsightDimensionTab[]>(
      () =>
        DIMENSION_TAB_ORDER.map((value) => ({
          value,
          label: getInsightDimensionLabel(value),
        })),
      [],
    );

    const toggleTheme = useCallback((): void => {
      useAppShellStore.getState().setThemePreference(isDark ? "light" : "dark");
    }, [isDark]);

    return {
      cadence,
      dimension,
      vm,
      showCompare,
      isDark,
      cadenceOptions: CADENCE_OPTIONS,
      dimensionTabs,
      selectCadence: setCadence,
      selectDimension: setDimension,
      toggleTheme,
    };
  };
