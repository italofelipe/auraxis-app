import { describe, expect, it } from "@jest/globals";

import { newtonRaphson, round2 } from "./math-utils";

describe("round2", () => {
  it("rounds to 2 decimal places", () => {
    expect(round2(1.005)).toBe(1);
    expect(round2(1.555)).toBe(1.56);
    expect(round2(100)).toBe(100);
    expect(round2(0.001)).toBe(0);
  });
});

describe("newtonRaphson", () => {
  it("finds square root of 2", () => {
    const root = newtonRaphson({
      f: (x) => x * x - 2,
      fPrime: (x) => 2 * x,
      x0: 1.5,
    });
    expect(root).not.toBeNull();
    expect(Math.abs(root! - Math.SQRT2)).toBeLessThan(1e-9);
  });

  it("finds root of cubic x^3 - 8 = 0", () => {
    const root = newtonRaphson({
      f: (x) => x * x * x - 8,
      fPrime: (x) => 3 * x * x,
      x0: 1,
    });
    expect(root).not.toBeNull();
    expect(Math.abs(root! - 2)).toBeLessThan(1e-9);
  });

  it("returns null when derivative is zero", () => {
    const root = newtonRaphson({
      f: (x) => x * x,
      fPrime: () => 0,
      x0: 0,
    });
    expect(root).toBeNull();
  });

  it("returns null when max iterations exceeded", () => {
    const root = newtonRaphson({
      f: (x) => Math.sin(x),
      fPrime: (x) => Math.cos(x),
      x0: Math.PI / 2,
      tolerance: 1e-10,
      maxIterations: 1,
    });
    expect(root).toBeNull();
  });
});
