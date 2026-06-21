import { formatReadTime, normalizeReadMinutes } from "@/features/insights/fluida/read-time";

describe("read time formatting", () => {
  it("formats a positive minute count as '{n} min de leitura'", () => {
    expect(formatReadTime(3)).toBe("3 min de leitura");
    expect(formatReadTime(15)).toBe("15 min de leitura");
  });

  it("clamps non-positive or fractional minutes to at least 1 whole minute", () => {
    expect(normalizeReadMinutes(0)).toBe(1);
    expect(normalizeReadMinutes(-4)).toBe(1);
    expect(normalizeReadMinutes(2.7)).toBe(3);
    expect(normalizeReadMinutes(4.2)).toBe(5);
  });

  it("coerces non-finite input to the 1-minute floor", () => {
    expect(normalizeReadMinutes(Number.NaN)).toBe(1);
    expect(formatReadTime(Number.POSITIVE_INFINITY)).toBe("1 min de leitura");
  });
});
