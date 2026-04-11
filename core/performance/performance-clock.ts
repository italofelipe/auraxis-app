/**
 * Resolves a monotonic timestamp when available, falling back to Date.now.
 */
export const now = (): number => {
  if (
    typeof performance !== "undefined"
    && typeof performance.now === "function"
  ) {
    return performance.now();
  }

  return Date.now();
};
