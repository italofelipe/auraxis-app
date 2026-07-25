import { act, renderHook } from "@testing-library/react-native";

import type { UserInsight } from "@/features/insights/contracts";
import { insightToFluidaVM } from "@/features/insights/fluida/insight-to-fluida-vm";
import { selectFluidaVM } from "@/features/insights/mocks/fluida-vm";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";
import { useInsightsFluidaScreenController } from "@/features/insights/hooks/use-insights-fluida-screen-controller";

jest.mock("@/features/insights/hooks/use-weekly-insight-query", () => ({
  useWeeklyInsight: jest.fn(),
}));

const mockedUseWeeklyInsight = jest.mocked(useWeeklyInsight);

const setLatestInsight = (insight: UserInsight | null): void => {
  mockedUseWeeklyInsight.mockReturnValue({
    insight,
    isLoading: false,
    isNew: false,
    fetchLatest: jest.fn(),
    markAsRead: jest.fn(),
    query: {} as never,
  });
};

/** A real insight carrying the structured Fluida payload. */
const realInsight: UserInsight = {
  id: "ins-real-1",
  content: "Resumo real.",
  keyMetric: "Saldo positivo",
  items: [],
  summary: null,
  periodType: "daily",
  periodLabel: "2026-06-20",
  periodStart: "2026-06-20T00:00:00.000Z",
  periodEnd: "2026-06-20T23:59:59.000Z",
  status: "delivered",
  generatedAt: "2026-06-20T09:00:00.000Z",
  readAt: null,
  metadata: {
    model: "gpt-4o-mini",
    tokensUsed: 100,
    costUsd: 0.0001,
    cached: false,
    contextVersion: "financial_insight_snapshot.v1",
  },
  paragraphs: ["Parágrafo real um.", "Parágrafo real dois."],
  retro: [
    {
      key: "yesterday",
      label: "Ontem",
      value: 156.3,
      caption: "Saídas de ontem",
      sign: "neg",
    },
  ],
  series: { daily: [10, 20, 30, 40, 50, 60, 70], weekly: [1, 2, 3, 4, 5, 6] },
  highlights: [{ label: "Maior gasto do mês", value: 11000, sub: "Fatura Maio" }],
};

beforeEach(() => {
  jest.clearAllMocks();
  setLatestInsight(null);
});

describe("useInsightsFluidaScreenController", () => {
  it("starts on the general dimension and the daily cadence", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.dimension).toBe("general");
    expect(result.current.cadence).toBe("daily");
  });

  it("starts on the dimension passed in (deep-link from a feature page)", () => {
    const { result } = renderHook(() =>
      useInsightsFluidaScreenController({ initialDimension: "transactions" }),
    );

    expect(result.current.dimension).toBe("transactions");
    expect(result.current.cadence).toBe("daily");
    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "transactions", cadence: "daily" }),
    );
  });

  it("ignores an undefined initial dimension and keeps the general default", () => {
    const { result } = renderHook(() =>
      useInsightsFluidaScreenController({ initialDimension: undefined }),
    );

    expect(result.current.dimension).toBe("general");
  });

  it("still lets the user switch dimension after a deep-linked start", () => {
    const { result } = renderHook(() =>
      useInsightsFluidaScreenController({ initialDimension: "budgets" }),
    );

    expect(result.current.dimension).toBe("budgets");

    act(() => {
      result.current.selectDimension("goals");
    });

    expect(result.current.dimension).toBe("goals");
  });

  it("derives the full VM from the mock for the active dimension × cadence", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "general", cadence: "daily" }),
    );
  });

  it("re-derives the VM when the dimension changes", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.selectDimension("transactions");
    });

    expect(result.current.dimension).toBe("transactions");
    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "transactions", cadence: "daily" }),
    );
  });

});

describe("useInsightsFluidaScreenController - dados reais e fallback", () => {
  it("derives the VM from the REAL insight when the structured payload is present", () => {
    setLatestInsight(realInsight);

    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.vm).toEqual(
      insightToFluidaVM(realInsight, { dimension: "general", cadence: "daily" }),
    );
    // The real body actually flows through (not the mock paragraphs/series).
    expect(result.current.vm.paragraphs).toEqual(realInsight.paragraphs);
    expect(result.current.vm.series).toEqual(realInsight.series);
  });

  it("re-derives the real VM for the active dimension × cadence on change", () => {
    setLatestInsight(realInsight);

    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.selectDimension("transactions");
    });
    act(() => {
      result.current.selectCadence("weekly");
    });

    expect(result.current.vm).toEqual(
      insightToFluidaVM(realInsight, {
        dimension: "transactions",
        cadence: "weekly",
      }),
    );
    // retro is general-only — gone on transactions even with real data.
    expect(result.current.vm.retro).toEqual([]);
    expect(result.current.showCompare).toBe(false);
  });

  it("falls back to the mock VM when no insight is loaded (backend 404 / not deployed)", () => {
    setLatestInsight(null);

    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "general", cadence: "daily" }),
    );
  });

  it("falls back to the mock when the insight lacks the structured fields", () => {
    const legacyInsight: UserInsight = {
      ...realInsight,
      paragraphs: undefined,
      retro: undefined,
      series: undefined,
      highlights: undefined,
    };
    setLatestInsight(legacyInsight);

    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "general", cadence: "daily" }),
    );
  });

});

describe("useInsightsFluidaScreenController - interacoes", () => {
  it("re-derives the VM when the cadence changes", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.selectCadence("weekly");
    });

    expect(result.current.cadence).toBe("weekly");
    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "general", cadence: "weekly" }),
    );
  });

  it("exposes comparative cards only on the general dimension", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.showCompare).toBe(true);
    expect(result.current.vm.retro.length).toBeGreaterThan(0);

    act(() => {
      result.current.selectDimension("transactions");
    });

    expect(result.current.showCompare).toBe(false);
  });

  it("keeps every beat coherent when cadence changes after a dimension change", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.selectDimension("transactions");
    });
    act(() => {
      result.current.selectCadence("weekly");
    });

    // No stale state: dimension + cadence both reflected, VM fully re-derived.
    expect(result.current.dimension).toBe("transactions");
    expect(result.current.cadence).toBe("weekly");
    expect(result.current.showCompare).toBe(false);
    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "transactions", cadence: "weekly" }),
    );
    expect(result.current.vm.retro).toHaveLength(0);
  });

  it("re-derives the chart series and compare flag together when switching back to general", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.selectCadence("weekly");
    });
    act(() => {
      result.current.selectDimension("budgets");
    });
    act(() => {
      result.current.selectDimension("general");
    });

    // Back on general at the weekly cadence: compare returns AND the weekly
    // series is the one exposed — nothing pinned from the daily/budgets path.
    expect(result.current.cadence).toBe("weekly");
    expect(result.current.showCompare).toBe(true);
    expect(result.current.vm.retro.length).toBeGreaterThan(0);
    expect(result.current.vm.series).toEqual(
      selectFluidaVM({ dimension: "general", cadence: "weekly" }).series,
    );
  });

  it("does not expose a theme shortcut outside Settings", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());
    expect(result.current).not.toHaveProperty("toggleTheme");
    expect(result.current).not.toHaveProperty("isDark");
  });

  it("lists the five theme tabs in the canonical order with labels", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.dimensionTabs.map((tab) => tab.value)).toEqual([
      "general",
      "transactions",
      "goals",
      "budgets",
      "credit_cards",
    ]);
    result.current.dimensionTabs.forEach((tab) => {
      expect(tab.label.length).toBeGreaterThan(0);
    });
  });
});
