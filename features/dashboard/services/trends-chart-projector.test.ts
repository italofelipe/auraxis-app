import { trendsChartProjector } from "@/features/dashboard/services/trends-chart-projector";
import type { DashboardTrendPoint } from "@/features/dashboard/contracts";

const buildPoint = (
  override: Partial<DashboardTrendPoint> = {},
): DashboardTrendPoint => ({
  month: "2026-04",
  income: 1000,
  expenses: 500,
  balance: 500,
  ...override,
});

describe("TrendsChartProjector.project", () => {
  it("retorna projecao vazia quando series vazia", () => {
    const projection = trendsChartProjector.project([]);
    expect(projection.bars).toEqual([]);
    expect(projection.maxAmount).toBe(0);
    expect(projection.netBalance).toBe(0);
  });

  it("normaliza widths em relacao ao max do periodo", () => {
    const projection = trendsChartProjector.project([
      buildPoint({ month: "2026-03", income: 500, expenses: 250, balance: 250 }),
      buildPoint({ month: "2026-04", income: 1000, expenses: 500, balance: 500 }),
    ]);
    expect(projection.maxAmount).toBe(1000);
    expect(projection.bars[0].incomeWidth).toBe(50);
    expect(projection.bars[1].incomeWidth).toBe(100);
    expect(projection.bars[0].expensesWidth).toBe(25);
  });

  it("acumula netBalance ao longo do periodo", () => {
    const projection = trendsChartProjector.project([
      buildPoint({ balance: 100 }),
      buildPoint({ balance: 200 }),
      buildPoint({ balance: -50 }),
    ]);
    expect(projection.netBalance).toBe(250);
  });

  it("retorna label legivel para mes valido", () => {
    const projection = trendsChartProjector.project([buildPoint({ month: "2026-04" })]);
    expect(projection.bars[0].label.length).toBeGreaterThan(0);
  });

  it("usa o proprio month como label quando data e invalida", () => {
    const projection = trendsChartProjector.project([
      buildPoint({ month: "data-bla" }),
    ]);
    expect(projection.bars[0].label).toBe("data-bla");
  });

  it("zero income/expenses produz width 0", () => {
    const projection = trendsChartProjector.project([
      buildPoint({ income: 0, expenses: 0 }),
    ]);
    expect(projection.bars[0].incomeWidth).toBe(0);
    expect(projection.bars[0].expensesWidth).toBe(0);
  });
});
