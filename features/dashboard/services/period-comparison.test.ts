import {
  buildPeriodComparison,
  resolveComparisonDirection,
} from "@/features/dashboard/services/period-comparison";

interface PointArgs {
  readonly month: string;
  readonly income: number;
  readonly expenses: number;
  readonly balance: number;
}

const point = (args: PointArgs) => args;

describe("buildPeriodComparison", () => {
  it("returns nulls when the selected month is absent", () => {
    const result = buildPeriodComparison(
      [point({ month: "2026-01", income: 1000, expenses: 800, balance: 200 })],
      "2026-03",
    );
    expect(result.current).toBeNull();
    expect(result.delta).toBeNull();
  });

  it("returns no delta when selected is the first month in the series", () => {
    const result = buildPeriodComparison(
      [point({ month: "2026-02", income: 1000, expenses: 600, balance: 400 })],
      "2026-02",
    );
    expect(result.previous).toBeNull();
    expect(result.delta).toBeNull();
  });

  it("computes delta and percent against the immediate previous month", () => {
    const result = buildPeriodComparison(
      [
        point({ month: "2026-01", income: 1000, expenses: 800, balance: 200 }),
        point({ month: "2026-02", income: 1500, expenses: 600, balance: 900 }),
      ],
      "2026-02",
    );
    expect(result.delta).toEqual({ income: 500, expenses: -200, balance: 700 });
    expect(result.percent?.income).toBeCloseTo(0.5);
    expect(result.percent?.expenses).toBeCloseTo(-0.25);
    expect(result.percent?.balance).toBeCloseTo(3.5);
  });

  it("handles divide-by-zero gracefully", () => {
    const result = buildPeriodComparison(
      [point({ month: "2026-01", income: 0, expenses: 0, balance: 0 }), point({ month: "2026-02", income: 100, expenses: 0, balance: 100 })],
      "2026-02",
    );
    expect(result.percent?.income).toBe(Number.POSITIVE_INFINITY);
    expect(result.percent?.expenses).toBe(0);
    expect(result.percent?.balance).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("resolveComparisonDirection", () => {
  it.each([
    [10, "up"],
    [-5, "down"],
    [0, "flat"],
    [Number.POSITIVE_INFINITY, "up"],
    [Number.NEGATIVE_INFINITY, "down"],
  ] as const)("delta %p → %p", (delta, expected) => {
    expect(resolveComparisonDirection(delta)).toBe(expected);
  });
});
