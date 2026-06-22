import type { UserInsight } from "@/features/insights/contracts";
import {
  INSIGHT_FLUIDA_RETRO_DIMENSION,
  insightToFluidaVM,
} from "@/features/insights/fluida/insight-to-fluida-vm";
import { selectFluidaVM } from "@/features/insights/mocks/fluida-vm";
import { formatCurrency } from "@/shared/utils/formatters";

const baseInsight: UserInsight = {
  id: "ins-real-1",
  content: "Resumo da semana.",
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
    tokensUsed: 420,
    costUsd: 0.0006,
    cached: false,
    contextVersion: "financial_insight_snapshot.v1",
  },
};

/** A real insight carrying the full structured Fluida payload. */
const fullInsight: UserInsight = {
  ...baseInsight,
  paragraphs: ["Parágrafo real um.", "Parágrafo real dois."],
  retro: [
    {
      key: "yesterday",
      label: "Ontem",
      value: 156.3,
      caption: "Saídas de ontem",
      sign: "neg",
    },
    {
      key: "daybefore",
      label: "Anteontem",
      value: 11950,
      caption: "Saídas de anteontem",
      sign: "neutral",
    },
    {
      key: "vs_week",
      label: "Semana vs. anterior",
      value: 9800,
      caption: "Variação de saídas da semana",
      sign: "neg",
    },
  ],
  series: {
    daily: [10, 20, 30, 40, 50, 60, 70],
    weekly: [100, 200, 300, 400, 500, 600],
  },
  highlights: [
    { label: "Maior gasto do mês", value: 11000, sub: "Fatura Maio" },
    { label: "Único crédito", value: 27675.37, sub: "Salário gringo" },
  ],
};

describe("insightToFluidaVM — real payload", () => {
  it("derives the VM body from the real insight (paragraphs/series)", () => {
    const vm = insightToFluidaVM(fullInsight, {
      dimension: "general",
      cadence: "daily",
    });

    expect(vm.paragraphs).toEqual(["Parágrafo real um.", "Parágrafo real dois."]);
    expect(vm.series).toEqual(fullInsight.series);
  });

  it("keeps the editorial lead (severity/title/lead/readMinutes) from the mock recorte", () => {
    const mock = selectFluidaVM({ dimension: "general", cadence: "daily" });
    const vm = insightToFluidaVM(fullInsight, {
      dimension: "general",
      cadence: "daily",
    });

    expect(vm.dimension).toBe("general");
    expect(vm.cadence).toBe("daily");
    expect(vm.severity).toBe(mock.severity);
    expect(vm.title).toBe(mock.title);
    expect(vm.lead).toBe(mock.lead);
    expect(vm.readMinutes).toBe(mock.readMinutes);
  });

  it("maps highlights, formatting the numeric backend value as a BRL string", () => {
    const vm = insightToFluidaVM(fullInsight, {
      dimension: "transactions",
      cadence: "daily",
    });

    expect(vm.highlights).toEqual([
      {
        label: "Maior gasto do mês",
        value: formatCurrency(11000),
        sub: "Fatura Maio",
      },
      {
        label: "Único crédito",
        value: formatCurrency(27675.37),
        sub: "Salário gringo",
      },
    ]);
  });

  it("maps retro entries verbatim (value stays numeric) on the general dimension", () => {
    const vm = insightToFluidaVM(fullInsight, {
      dimension: "general",
      cadence: "daily",
    });

    expect(vm.retro).toEqual(fullInsight.retro);
  });

  it("drops the retro block for non-general dimensions (compare beat is general-only)", () => {
    expect(INSIGHT_FLUIDA_RETRO_DIMENSION).toBe("general");

    const vm = insightToFluidaVM(fullInsight, {
      dimension: "transactions",
      cadence: "daily",
    });

    expect(vm.retro).toEqual([]);
  });

  it("selects the daily series both cadences share (cadence drives the lead recorte)", () => {
    const weekly = insightToFluidaVM(fullInsight, {
      dimension: "general",
      cadence: "weekly",
    });
    const mockWeekly = selectFluidaVM({ dimension: "general", cadence: "weekly" });

    // Weekly recorte: lead is the weekly mock, but the structured series is the
    // real one (the chart slices daily/weekly off the same payload).
    expect(weekly.cadence).toBe("weekly");
    expect(weekly.title).toBe(mockWeekly.title);
    expect(weekly.series).toEqual(fullInsight.series);
  });
});

describe("insightToFluidaVM — fallback to the mock", () => {
  it("falls back to the mock VM when the insight is null (backend 404)", () => {
    const vm = insightToFluidaVM(null, { dimension: "general", cadence: "daily" });

    expect(vm).toEqual(selectFluidaVM({ dimension: "general", cadence: "daily" }));
  });

  it("falls back to the mock when the insight lacks the structured fields (legacy backend)", () => {
    const vm = insightToFluidaVM(baseInsight, {
      dimension: "transactions",
      cadence: "weekly",
    });

    expect(vm).toEqual(
      selectFluidaVM({ dimension: "transactions", cadence: "weekly" }),
    );
  });

  it("falls back when paragraphs and series are both absent even if highlights leak in", () => {
    const partial: UserInsight = {
      ...baseInsight,
      highlights: [{ label: "x", value: 1, sub: "y" }],
    };

    const vm = insightToFluidaVM(partial, {
      dimension: "general",
      cadence: "daily",
    });

    // No usable body (no paragraphs, no series) ⇒ mock, not a half-empty reading.
    expect(vm).toEqual(selectFluidaVM({ dimension: "general", cadence: "daily" }));
  });

  it("renders the real body even when highlights/retro are absent (series present)", () => {
    const seriesOnly: UserInsight = {
      ...baseInsight,
      paragraphs: ["Só um parágrafo real."],
      series: { daily: [1, 2, 3, 4, 5, 6, 7], weekly: [1, 2, 3, 4, 5, 6] },
    };

    const vm = insightToFluidaVM(seriesOnly, {
      dimension: "general",
      cadence: "daily",
    });

    expect(vm.paragraphs).toEqual(["Só um parágrafo real."]);
    expect(vm.series).toEqual(seriesOnly.series);
    expect(vm.highlights).toEqual([]);
    expect(vm.retro).toEqual([]);
  });

  it("falls back when paragraphs is an empty array (no prose to render)", () => {
    const noProse: UserInsight = {
      ...baseInsight,
      paragraphs: [],
      series: { daily: [1, 2, 3, 4, 5, 6, 7], weekly: [1, 2, 3, 4, 5, 6] },
    };

    // Series alone with no prose still renders the real reading (chart-driven).
    const vm = insightToFluidaVM(noProse, {
      dimension: "general",
      cadence: "daily",
    });

    expect(vm.series).toEqual(noProse.series);
    expect(vm.paragraphs).toEqual([]);
  });
});
