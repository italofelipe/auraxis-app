import type {
  InsightCadence,
  InsightSeries,
} from "@/features/insights/fluida/contracts";
import {
  buildChartBars,
  peakIndex,
  selectSeriesValues,
  SERIES_LABELS,
} from "@/features/insights/fluida/series";

const series: InsightSeries = {
  daily: [1200, 0, 250, 0, 2650, 0, 11950],
  weekly: [4200, 980, 3100, 1400, 9800, 13650],
};

describe("peakIndex", () => {
  it("returns the index of the largest value", () => {
    expect(peakIndex([1200, 0, 250, 0, 2650, 0, 11950])).toBe(6);
  });

  it("returns the first index when several values tie for the max", () => {
    expect(peakIndex([5, 9, 9, 2])).toBe(1);
  });

  it("returns -1 for an empty series so callers can guard the highlight", () => {
    expect(peakIndex([])).toBe(-1);
  });

  it("ignores non-finite values when finding the peak", () => {
    expect(peakIndex([10, Number.NaN, 30, 20])).toBe(2);
  });
});

describe("selectSeriesValues", () => {
  it("returns the 7 daily values for the daily cadence", () => {
    expect(selectSeriesValues(series, "daily")).toEqual(series.daily);
    expect(selectSeriesValues(series, "daily")).toHaveLength(7);
  });

  it("returns the 6 weekly values for the weekly cadence", () => {
    expect(selectSeriesValues(series, "weekly")).toEqual(series.weekly);
    expect(selectSeriesValues(series, "weekly")).toHaveLength(6);
  });
});

describe("SERIES_LABELS", () => {
  it("exposes 7 day labels and 6 week labels aligned with the cadence", () => {
    expect(SERIES_LABELS.daily).toHaveLength(7);
    expect(SERIES_LABELS.weekly).toHaveLength(6);
    expect(SERIES_LABELS.weekly[SERIES_LABELS.weekly.length - 1]).toBe("Atual");
  });
});

describe("buildChartBars", () => {
  const cadences: readonly InsightCadence[] = ["daily", "weekly"];

  cadences.forEach((cadence) => {
    it(`returns one labelled bar per ${cadence} value with the peak flagged`, () => {
      const bars = buildChartBars(series, cadence);
      const values = selectSeriesValues(series, cadence);

      expect(bars).toHaveLength(values.length);
      expect(bars.map((bar) => bar.label)).toEqual([...SERIES_LABELS[cadence]]);

      const flagged = bars.filter((bar) => bar.isPeak);
      expect(flagged).toHaveLength(1);
      expect(flagged[0].value).toBe(Math.max(...values));
    });
  });

  it("sizes the fill ratio of each bar relative to the peak (0..1)", () => {
    const bars = buildChartBars(series, "daily");
    const peakBar = bars.find((bar) => bar.isPeak);

    expect(peakBar?.ratio).toBe(1);
    bars.forEach((bar) => {
      expect(bar.ratio).toBeGreaterThanOrEqual(0);
      expect(bar.ratio).toBeLessThanOrEqual(1);
    });
  });

  it("never flags a peak when every value is zero", () => {
    const flat: InsightSeries = { daily: [0, 0, 0], weekly: [0, 0, 0] };
    const bars = buildChartBars(flat, "daily");

    expect(bars.every((bar) => bar.isPeak === false)).toBe(true);
    expect(bars.every((bar) => bar.ratio === 0)).toBe(true);
  });
});
