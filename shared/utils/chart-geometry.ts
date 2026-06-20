/**
 * Pure geometry helpers for the chart primitives (Donut, LimitRing,
 * AreaLineChart). No React/SVG imports — just math — so the logic is unit
 * testable in isolation and the components stay thin.
 *
 * Conventions:
 * - Angles are expressed implicitly through stroke-dash math on a circle, the
 *   technique used by `react-native-svg` ring charts: a `<Circle>` with a
 *   `strokeDasharray` of the full circumference and a `strokeDashoffset` that
 *   hides the unused portion. Rotating the circle -90deg (done in the
 *   component) makes arcs start at 12 o'clock.
 * - Coordinates for the area/line chart map data values into an SVG viewBox
 *   where y grows downward (so larger values sit higher on screen).
 */

/** Geometry for a single ring (track + a full-circumference circle). */
export interface RingGeometry {
  /** Center x/y (the ring is square, so cx === cy === size / 2). */
  readonly center: number;
  /** Stroke radius (inset by half the stroke so the ring fits the box). */
  readonly radius: number;
  /** Full circle circumference (2·π·r) — the `strokeDasharray` length. */
  readonly circumference: number;
}

/**
 * Computes the shared geometry of a ring chart from its box size and stroke.
 *
 * @param size Outer square size (px).
 * @param strokeWidth Ring thickness (px).
 * @returns Center, inset radius and circumference. Radius is clamped to 0.
 */
export const computeRingGeometry = (
  size: number,
  strokeWidth: number,
): RingGeometry => {
  const center = size / 2;
  const radius = Math.max(0, center - strokeWidth / 2);
  return {
    center,
    radius,
    circumference: 2 * Math.PI * radius,
  };
};

/**
 * Clamps a percentage to the inclusive `[0, 100]` range. NaN becomes 0 so a
 * bad input never produces an invalid dash offset.
 *
 * @param pct Raw percentage.
 * @returns Percentage within `[0, 100]`.
 */
export const clampPercent = (pct: number): number => {
  if (!Number.isFinite(pct)) {
    return 0;
  }
  return Math.min(100, Math.max(0, pct));
};

/**
 * Stroke-dash offset that reveals exactly `pct`% of a ring. At 0% the whole
 * circumference is offset (nothing drawn); at 100% the offset is 0 (full ring).
 *
 * @param pct Percentage to reveal (clamped to `[0, 100]`).
 * @param circumference Full circle circumference.
 * @returns The `strokeDashoffset` value.
 */
export const dashOffsetForPercent = (
  pct: number,
  circumference: number,
): number => {
  const safePct = clampPercent(pct);
  return circumference * (1 - safePct / 100);
};

/** A computed donut segment ready to map onto a `<Circle>`. */
export interface DonutSegment {
  /** Original datum id (caller key). */
  readonly id: string;
  /** Segment colour (passed straight to the stroke). */
  readonly color: string;
  /** Fraction of the whole this segment represents, in `[0, 1]`. */
  readonly fraction: number;
  /** `strokeDasharray`: the drawn arc length followed by the remaining gap. */
  readonly dashArray: readonly [number, number];
  /** `strokeDashoffset` placing this segment after the previous ones. */
  readonly dashOffset: number;
}

/** Minimal datum shape consumed by {@link computeDonutSegments}. */
export interface DonutDatum {
  readonly id: string;
  readonly color: string;
  readonly total: number;
}

/**
 * Turns a list of weighted data into concentric arc segments laid head-to-tail
 * around a single ring. Negative/non-finite totals are treated as 0. When every
 * total is 0 the segments collapse to zero-length arcs (nothing is drawn).
 *
 * @param data Segments with a positive `total` weight.
 * @param circumference Ring circumference the segments are spread across.
 * @returns One {@link DonutSegment} per input datum, in order.
 */
export const computeDonutSegments = (
  data: readonly DonutDatum[],
  circumference: number,
): readonly DonutSegment[] => {
  const sanitizedTotals = data.map((datum) =>
    Number.isFinite(datum.total) && datum.total > 0 ? datum.total : 0,
  );
  const sum = sanitizedTotals.reduce((acc, value) => acc + value, 0);

  let consumedFraction = 0;
  return data.map((datum, index) => {
    const fraction = sum > 0 ? sanitizedTotals[index] / sum : 0;
    const arcLength = circumference * fraction;
    // The offset rotates the dash pattern backwards so each arc begins where
    // the previous one ended (offsets accumulate clockwise from 12 o'clock).
    const dashOffset = circumference * (1 - consumedFraction);
    consumedFraction += fraction;
    return {
      id: datum.id,
      color: datum.color,
      fraction,
      dashArray: [arcLength, circumference - arcLength],
      dashOffset,
    };
  });
};

/** A point projected into the chart viewBox (SVG pixel coordinates). */
export interface ChartPoint {
  readonly x: number;
  readonly y: number;
}

/** Inputs for {@link buildAreaLinePath} / {@link projectPoints}. */
export interface AreaLineScaleInput {
  /** Raw series values (y axis). */
  readonly values: readonly number[];
  /** ViewBox width (px). */
  readonly width: number;
  /** ViewBox height (px). */
  readonly height: number;
  /** Vertical inset kept clear at the top and bottom (px). Default 0. */
  readonly paddingY?: number;
}

/**
 * Projects raw series values into evenly-spaced points within a viewBox. The
 * max value maps to the top inset and the min to the bottom inset; a flat
 * series is centered vertically. A single point is centered horizontally.
 *
 * @param input Series values plus viewBox dimensions.
 * @returns One {@link ChartPoint} per value, left-to-right.
 */
export const projectPoints = (input: AreaLineScaleInput): readonly ChartPoint[] => {
  const { values, width, height } = input;
  const paddingY = input.paddingY ?? 0;
  if (values.length === 0) {
    return [];
  }

  const usableHeight = Math.max(0, height - paddingY * 2);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;

  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  return values.map((value, index) => {
    const x = values.length > 1 ? stepX * index : width / 2;
    // Normalised height ratio in [0, 1]; flat series sits at the middle.
    const ratio = span > 0 ? (value - min) / span : 0.5;
    const y = paddingY + (1 - ratio) * usableHeight;
    return { x, y };
  });
};

/**
 * Builds the SVG `d` string for the line connecting the projected points.
 *
 * @param points Projected chart points.
 * @returns A `M…L…` path, or "" when there are no points.
 */
export const buildLinePath = (points: readonly ChartPoint[]): string => {
  if (points.length === 0) {
    return "";
  }
  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${round(point.x)} ${round(point.y)}`;
    })
    .join(" ");
};

/**
 * Builds the SVG `d` string for the filled area under the line: the line path
 * closed down to the baseline and back. Returns "" for an empty series.
 *
 * @param points Projected chart points.
 * @param height ViewBox height — the baseline the area drops to.
 * @returns A closed area path, or "".
 */
export const buildAreaLinePath = (
  points: readonly ChartPoint[],
  height: number,
): string => {
  if (points.length === 0) {
    return "";
  }
  const line = buildLinePath(points);
  const lastX = round(points[points.length - 1].x);
  const firstX = round(points[0].x);
  const baseline = round(height);
  return `${line} L${lastX} ${baseline} L${firstX} ${baseline} Z`;
};

/**
 * Maps a value to its filled fraction (`value / max`) clamped to `[0, 1]` —
 * shared by the bar (`HBars`) and meter primitives that size fills by
 * percentage. A non-positive or non-finite `max` yields 0.
 *
 * @param value Datum value.
 * @param max Reference maximum.
 * @returns Fill ratio in `[0, 1]`.
 */
export const fillRatio = (value: number, max: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, value / max));
};

/**
 * The largest value in a series, used as the default bar-chart maximum. Returns
 * 0 for an empty series so callers can guard against divide-by-zero.
 *
 * @param values Series values.
 * @returns The maximum, or 0 when empty.
 */
export const maxValue = (values: readonly number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  return Math.max(...values);
};

// Rounds to 2 decimals to keep generated path strings compact and stable.
const round = (value: number): number => Math.round(value * 100) / 100;
