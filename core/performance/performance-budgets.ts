export type PerformanceMetricKey =
  | "startup.total"
  | "runtime.revalidation"
  | "runtime.reachability";

export type PerformanceBudgetMap = Record<PerformanceMetricKey, number>;

export const PERFORMANCE_BUDGETS: PerformanceBudgetMap = {
  "startup.total": 2000,
  "runtime.revalidation": 1500,
  "runtime.reachability": 500,
};

// ---------------------------------------------------------------------------
// Bundle size budgets (bytes)
// ---------------------------------------------------------------------------

/**
 * Hard limits for JS bundle and asset bundle sizes.
 * CI validates these via `expo export` artifact size check.
 */
export const BUNDLE_SIZE_BUDGETS = {
  /** Main JS bundle — android/ios combined output (bytes). */
  "bundle.js": 3_500_000,
  /** All static image/font assets included in the bundle (bytes). */
  "bundle.assets": 5_000_000,
} as const;

export type BundleSizeMetricKey = keyof typeof BUNDLE_SIZE_BUDGETS;

// ---------------------------------------------------------------------------
// Memory budgets (bytes)
// ---------------------------------------------------------------------------

/**
 * Soft memory thresholds for the JS heap at runtime.
 * Captured via `performance.memory` (Hermes) or Flipper in dev.
 */
export const MEMORY_BUDGETS = {
  /** JS heap size at cold startup should stay below this value. */
  "memory.js_heap.startup": 50 * 1024 * 1024, // 50 MB
  /** JS heap ceiling during sustained use (no active navigation). */
  "memory.js_heap.idle": 80 * 1024 * 1024, // 80 MB
} as const;

export type MemoryMetricKey = keyof typeof MEMORY_BUDGETS;

// ---------------------------------------------------------------------------
// Image optimization baseline
// ---------------------------------------------------------------------------

/**
 * Per-image size thresholds for static assets shipped with the app.
 * Enforced by the `policy:check` governance script.
 */
export const IMAGE_SIZE_BUDGETS = {
  /** Maximum bytes for a single PNG/JPEG asset at 3x density. */
  "image.asset.max": 200 * 1024, // 200 KB
  /** Maximum bytes for icon assets (1x/2x/3x combined). */
  "image.icon.max": 30 * 1024, // 30 KB
} as const;

export type ImageSizeMetricKey = keyof typeof IMAGE_SIZE_BUDGETS;

/**
 * Returns the canonical performance budget (ms) for a metric.
 */
export const getPerformanceBudget = (
  metric: PerformanceMetricKey,
): number => {
  return PERFORMANCE_BUDGETS[metric];
};

/**
 * Returns the canonical bundle size budget (bytes) for a metric.
 */
export const getBundleSizeBudget = (
  metric: BundleSizeMetricKey,
): number => {
  return BUNDLE_SIZE_BUDGETS[metric];
};

/**
 * Returns the canonical memory budget (bytes) for a metric.
 */
export const getMemoryBudget = (
  metric: MemoryMetricKey,
): number => {
  return MEMORY_BUDGETS[metric];
};

/**
 * Returns the canonical image size budget (bytes) for a metric.
 */
export const getImageSizeBudget = (
  metric: ImageSizeMetricKey,
): number => {
  return IMAGE_SIZE_BUDGETS[metric];
};
