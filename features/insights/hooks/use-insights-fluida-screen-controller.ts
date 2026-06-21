import { useCallback, useMemo, useState } from "react";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import type { InsightDimension } from "@/features/insights/contracts";
import type {
  InsightCadence,
  InsightLeadVM,
} from "@/features/insights/fluida/contracts";
import { getInsightDimensionLabel } from "@/features/insights/hooks/use-insights-by-dimension";
import { selectFluidaLead } from "@/features/insights/mocks/fluida-lead";

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

export interface InsightsFluidaScreenController {
  readonly cadence: InsightCadence;
  readonly dimension: InsightDimension;
  readonly lead: InsightLeadVM;
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
 * Screen controller for the "Fluida" insights screen (etapa 1). Owns the
 * selected cadence and dimension, derives the editorial lead VM from the
 * mock fixture, and bridges the light/dark toggle to the app shell theme
 * preference. View-only components consume this; no business logic lives
 * in the screen itself.
 *
 * @returns The derived state and handlers for the Fluida screen.
 */
export const useInsightsFluidaScreenController =
  (): InsightsFluidaScreenController => {
    const [cadence, setCadence] = useState<InsightCadence>("daily");
    const [dimension, setDimension] = useState<InsightDimension>("general");
    const resolvedTheme = useResolvedTheme();
    const isDark = resolvedTheme === "auraxis_dark";

    const lead = useMemo(
      () => selectFluidaLead({ dimension, cadence }),
      [cadence, dimension],
    );

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
      lead,
      isDark,
      cadenceOptions: CADENCE_OPTIONS,
      dimensionTabs,
      selectCadence: setCadence,
      selectDimension: setDimension,
      toggleTheme,
    };
  };
