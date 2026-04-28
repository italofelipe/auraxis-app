import {
  buildCalendarMonth,
  stepMonth,
} from "@/features/transactions/services/calendar-grid";

describe("buildCalendarMonth", () => {
  it("returns 6 rows of 7 days for any month", () => {
    const result = buildCalendarMonth(2026, 4);
    expect(result.weeks).toHaveLength(6);
    for (const week of result.weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("pads trailing days of the previous month", () => {
    // April 2026 starts on a Wednesday (weekday 3 → 3 trailing days).
    const result = buildCalendarMonth(2026, 4);
    const firstWeek = result.weeks[0]!;
    expect(firstWeek[0]?.inMonth).toBe(false);
    expect(firstWeek[0]?.day).toBe("2026-03-29");
    expect(firstWeek[3]?.day).toBe("2026-04-01");
    expect(firstWeek[3]?.inMonth).toBe(true);
  });

  it("pads leading days of the next month", () => {
    const result = buildCalendarMonth(2026, 2);
    const lastCell = result.weeks[5]![6]!;
    expect(lastCell.inMonth).toBe(false);
    expect(lastCell.day.startsWith("2026-03-")).toBe(true);
  });

  it("formats ISO days with zero-padding", () => {
    const result = buildCalendarMonth(2026, 1);
    const day3 = result.weeks
      .flat()
      .find((c) => c.inMonth && c.dayOfMonth === 3);
    expect(day3?.day).toBe("2026-01-03");
  });
});

describe("stepMonth", () => {
  it("walks forward across the year boundary", () => {
    expect(stepMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("walks backward across the year boundary", () => {
    expect(stepMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("supports multi-step deltas", () => {
    expect(stepMonth(2026, 5, 7)).toEqual({ year: 2026, month: 12 });
    expect(stepMonth(2026, 5, 8)).toEqual({ year: 2027, month: 1 });
  });
});
