import { renderHook } from "@testing-library/react-native";

import type { UserInsight } from "@/features/insights/contracts";
import { insightToFluidaVM } from "@/features/insights/fluida/insight-to-fluida-vm";
import { selectFluidaVM } from "@/features/insights/mocks/fluida-vm";
import { useInsightSection } from "@/features/insights/hooks/use-insight-section";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { toInsightSectionVM } from "@/shared/insights/insight-section-vm";

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

jest.mock("@/features/insights/hooks/use-weekly-insight-query", () => ({
  useWeeklyInsight: jest.fn(),
}));

const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);
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
  paragraphs: ["Parágrafo real."],
  series: { daily: [10, 20, 30, 40, 50, 60, 70], weekly: [1, 2, 3, 4, 5, 6] },
  highlights: [
    { label: "Maior gasto do mês", value: 11000, sub: "Fatura Maio" },
    { label: "Único crédito", value: 27675.37, sub: "Salário gringo" },
    { label: "Gasto de ontem", value: 156.3, sub: "Eletrônicos" },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedIsFeatureEnabled.mockReturnValue(true);
  setLatestInsight(null);
});

describe("useInsightSection", () => {
  it("gates on the app.insights.fluida flag", () => {
    mockedIsFeatureEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useInsightSection("transactions"));

    expect(mockedIsFeatureEnabled).toHaveBeenCalledWith("app.insights.fluida");
    expect(result.current).toBeNull();
  });

  it("returns the compact recorte for the requested dimension when enabled", () => {
    const { result } = renderHook(() => useInsightSection("transactions"));
    const fullVM = selectFluidaVM({ dimension: "transactions", cadence: "daily" });

    expect(result.current).not.toBeNull();
    expect(result.current?.dimension).toBe("transactions");
    expect(result.current?.severity).toBe(fullVM.severity);
    expect(result.current?.title).toBe(fullVM.title);
    expect(result.current?.lead).toBe(fullVM.lead);
  });

  it("condenses the highlights to at most two (compact section)", () => {
    const { result } = renderHook(() => useInsightSection("transactions"));
    const fullVM = selectFluidaVM({ dimension: "transactions", cadence: "daily" });

    expect(fullVM.highlights.length).toBeGreaterThan(2);
    expect(result.current?.highlights).toHaveLength(2);
    expect(result.current?.highlights[0]).toEqual(fullVM.highlights[0]);
  });

  it("falls back to the general recorte for an unmapped dimension", () => {
    const { result } = renderHook(() => useInsightSection("wallet"));
    const generalVM = selectFluidaVM({ dimension: "general", cadence: "daily" });

    expect(result.current?.dimension).toBe("general");
    expect(result.current?.title).toBe(generalVM.title);
  });

  it("derives the compact recorte from the REAL insight when present", () => {
    setLatestInsight(realInsight);

    const { result } = renderHook(() => useInsightSection("transactions"));
    const expected = toInsightSectionVM(
      insightToFluidaVM(realInsight, {
        dimension: "transactions",
        cadence: "daily",
      }),
    );

    expect(result.current).toEqual(expected);
    // The real highlights (formatted BRL) flow through, condensed to two.
    expect(result.current?.highlights).toHaveLength(2);
    expect(result.current?.highlights[0]?.label).toBe("Maior gasto do mês");
  });

  it("falls back to the mock recorte when the real insight has no structured fields", () => {
    const legacyInsight: UserInsight = {
      ...realInsight,
      paragraphs: undefined,
      series: undefined,
      highlights: undefined,
    };
    setLatestInsight(legacyInsight);

    const { result } = renderHook(() => useInsightSection("goals"));
    const fallback = toInsightSectionVM(
      selectFluidaVM({ dimension: "goals", cadence: "daily" }),
    );

    expect(result.current).toEqual(fallback);
  });

  it("re-derives the recorte when the dimension changes", () => {
    const { result, rerender } = renderHook(
      ({ dimension }: { dimension: string }) => useInsightSection(dimension),
      { initialProps: { dimension: "goals" } },
    );

    expect(result.current?.dimension).toBe("goals");

    rerender({ dimension: "budgets" });

    expect(result.current?.dimension).toBe("budgets");
  });
});
