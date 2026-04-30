/**
 * Shared math utilities for financial calculators.
 */

/**
 * Rounds a number to 2 decimal places (currency precision).
 * @param value
 * @returns The rounded value.
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface NewtonRaphsonOptions {
  f: (x: number) => number;
  fPrime: (x: number) => number;
  x0: number;
  tolerance?: number;
  maxIterations?: number;
}

/**
 * Finds the root of f(x) = 0 using Newton-Raphson iteration.
 *
 * @param options Solver configuration.
 * @returns The root, or null if convergence fails.
 */
export function newtonRaphson(options: NewtonRaphsonOptions): number | null {
  const { f, fPrime, x0, tolerance = 1e-10, maxIterations = 200 } = options;
  let x = x0;

  for (let i = 0; i < maxIterations; i++) {
    const fx = f(x);
    const fpx = fPrime(x);

    if (Math.abs(fpx) < 1e-15) { return null; }

    const xNext = x - fx / fpx;

    if (Math.abs(xNext - x) < tolerance) { return xNext; }

    x = xNext;
  }

  return null;
}
