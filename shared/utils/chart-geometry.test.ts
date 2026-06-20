import {
  buildAreaLinePath,
  buildLinePath,
  clampPercent,
  computeDonutSegments,
  computeRingGeometry,
  dashOffsetForPercent,
  fillRatio,
  maxValue,
  projectPoints,
} from "@/shared/utils/chart-geometry";

describe("computeRingGeometry", () => {
  it("centers the ring and insets the radius by half the stroke", () => {
    const geometry = computeRingGeometry(120, 13);

    expect(geometry.center).toBe(60);
    expect(geometry.radius).toBeCloseTo(53.5);
    expect(geometry.circumference).toBeCloseTo(2 * Math.PI * 53.5);
  });

  it("clamps the radius to zero when the stroke is wider than the box", () => {
    const geometry = computeRingGeometry(10, 40);

    expect(geometry.radius).toBe(0);
    expect(geometry.circumference).toBe(0);
  });
});

describe("clampPercent", () => {
  it("keeps values already inside the range", () => {
    expect(clampPercent(42)).toBe(42);
  });

  it("clamps below 0 and above 100", () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(140)).toBe(100);
  });

  it("treats non-finite input as 0", () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("dashOffsetForPercent", () => {
  const circumference = 100;

  it("offsets the whole circumference at 0%", () => {
    expect(dashOffsetForPercent(0, circumference)).toBe(100);
  });

  it("offsets nothing at 100%", () => {
    expect(dashOffsetForPercent(100, circumference)).toBe(0);
  });

  it("offsets half at 50%", () => {
    expect(dashOffsetForPercent(50, circumference)).toBe(50);
  });

  it("clamps out-of-range percentages", () => {
    expect(dashOffsetForPercent(150, circumference)).toBe(0);
    expect(dashOffsetForPercent(-10, circumference)).toBe(100);
  });
});

describe("computeDonutSegments", () => {
  const circumference = 360;

  it("splits the ring proportionally to each total", () => {
    const segments = computeDonutSegments(
      [
        { id: "a", color: "#111", total: 30 },
        { id: "b", color: "#222", total: 10 },
      ],
      circumference,
    );

    expect(segments).toHaveLength(2);
    expect(segments[0].fraction).toBeCloseTo(0.75);
    expect(segments[1].fraction).toBeCloseTo(0.25);
    expect(segments[0].dashArray[0]).toBeCloseTo(270);
    expect(segments[1].dashArray[0]).toBeCloseTo(90);
  });

  it("lays segments head-to-tail via accumulating dash offsets", () => {
    const segments = computeDonutSegments(
      [
        { id: "a", color: "#111", total: 25 },
        { id: "b", color: "#222", total: 75 },
      ],
      circumference,
    );

    // First segment starts at the top (offset === circumference).
    expect(segments[0].dashOffset).toBeCloseTo(360);
    // Second starts after the first 25% has been consumed.
    expect(segments[1].dashOffset).toBeCloseTo(circumference * 0.75);
  });

  it("preserves id and color from the input data", () => {
    const segments = computeDonutSegments(
      [{ id: "food", color: "#abc", total: 5 }],
      circumference,
    );

    expect(segments[0].id).toBe("food");
    expect(segments[0].color).toBe("#abc");
  });

  it("collapses to zero-length arcs when all totals are zero", () => {
    const segments = computeDonutSegments(
      [
        { id: "a", color: "#111", total: 0 },
        { id: "b", color: "#222", total: 0 },
      ],
      circumference,
    );

    expect(segments[0].fraction).toBe(0);
    expect(segments[1].fraction).toBe(0);
    expect(segments[0].dashArray[0]).toBe(0);
  });

  it("ignores negative and non-finite totals", () => {
    const segments = computeDonutSegments(
      [
        { id: "a", color: "#111", total: -50 },
        { id: "b", color: "#222", total: Number.NaN },
        { id: "c", color: "#333", total: 100 },
      ],
      circumference,
    );

    expect(segments[0].fraction).toBe(0);
    expect(segments[1].fraction).toBe(0);
    expect(segments[2].fraction).toBeCloseTo(1);
  });

  it("returns an empty list for empty input", () => {
    expect(computeDonutSegments([], circumference)).toEqual([]);
  });
});

describe("projectPoints", () => {
  it("spaces points evenly across the width", () => {
    const points = projectPoints({
      values: [0, 5, 10],
      width: 100,
      height: 50,
    });

    expect(points.map((point) => point.x)).toEqual([0, 50, 100]);
  });

  it("maps the max value to the top and the min to the bottom", () => {
    const points = projectPoints({
      values: [10, 20],
      width: 100,
      height: 100,
    });

    // Higher value -> smaller y (top); lower value -> larger y (bottom).
    expect(points[1].y).toBeLessThan(points[0].y);
    expect(points[0].y).toBeCloseTo(100);
    expect(points[1].y).toBeCloseTo(0);
  });

  it("respects vertical padding", () => {
    const points = projectPoints({
      values: [10, 20],
      width: 100,
      height: 100,
      paddingY: 10,
    });

    expect(points[1].y).toBeCloseTo(10);
    expect(points[0].y).toBeCloseTo(90);
  });

  it("centers a flat series vertically", () => {
    const points = projectPoints({
      values: [7, 7, 7],
      width: 100,
      height: 80,
    });

    points.forEach((point) => expect(point.y).toBeCloseTo(40));
  });

  it("centers a single point horizontally", () => {
    const points = projectPoints({ values: [42], width: 120, height: 50 });

    expect(points).toHaveLength(1);
    expect(points[0].x).toBe(60);
  });

  it("returns an empty list for empty input", () => {
    expect(projectPoints({ values: [], width: 100, height: 50 })).toEqual([]);
  });
});

describe("buildLinePath", () => {
  it("starts with a move command and connects with line commands", () => {
    const path = buildLinePath([
      { x: 0, y: 10 },
      { x: 50, y: 5 },
      { x: 100, y: 0 },
    ]);

    expect(path).toBe("M0 10 L50 5 L100 0");
  });

  it("returns an empty string for no points", () => {
    expect(buildLinePath([])).toBe("");
  });
});

describe("buildAreaLinePath", () => {
  it("closes the line down to the baseline", () => {
    const path = buildAreaLinePath(
      [
        { x: 0, y: 10 },
        { x: 100, y: 0 },
      ],
      140,
    );

    expect(path).toBe("M0 10 L100 0 L100 140 L0 140 Z");
  });

  it("returns an empty string for no points", () => {
    expect(buildAreaLinePath([], 140)).toBe("");
  });
});

describe("fillRatio", () => {
  it("returns the clamped value/max ratio", () => {
    expect(fillRatio(50, 200)).toBe(0.25);
  });

  it("clamps to 1 when value exceeds max", () => {
    expect(fillRatio(300, 200)).toBe(1);
  });

  it("returns 0 for a non-positive or non-finite max", () => {
    expect(fillRatio(10, 0)).toBe(0);
    expect(fillRatio(10, -5)).toBe(0);
    expect(fillRatio(10, Number.NaN)).toBe(0);
  });

  it("returns 0 for a non-finite value", () => {
    expect(fillRatio(Number.NaN, 100)).toBe(0);
  });
});

describe("maxValue", () => {
  it("returns the largest value", () => {
    expect(maxValue([3, 9, 2])).toBe(9);
  });

  it("returns 0 for an empty series", () => {
    expect(maxValue([])).toBe(0);
  });
});
