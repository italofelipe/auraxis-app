import {
  BUNDLE_SIZE_BUDGETS,
  IMAGE_SIZE_BUDGETS,
  MEMORY_BUDGETS,
  PERFORMANCE_BUDGETS,
  getBundleSizeBudget,
  getImageSizeBudget,
  getMemoryBudget,
  getPerformanceBudget,
} from "@/core/performance/performance-budgets";

describe("performance budgets", () => {
  it("returns the canonical budget for each metric", () => {
    expect(getPerformanceBudget("startup.total")).toBe(
      PERFORMANCE_BUDGETS["startup.total"],
    );
    expect(getPerformanceBudget("runtime.revalidation")).toBe(
      PERFORMANCE_BUDGETS["runtime.revalidation"],
    );
    expect(getPerformanceBudget("runtime.reachability")).toBe(
      PERFORMANCE_BUDGETS["runtime.reachability"],
    );
  });
});

describe("bundle size budgets", () => {
  it("returns the canonical bundle size budget for each metric", () => {
    expect(getBundleSizeBudget("bundle.js")).toBe(
      BUNDLE_SIZE_BUDGETS["bundle.js"],
    );
    expect(getBundleSizeBudget("bundle.assets")).toBe(
      BUNDLE_SIZE_BUDGETS["bundle.assets"],
    );
  });

  it("has reasonable thresholds for a React Native app", () => {
    expect(BUNDLE_SIZE_BUDGETS["bundle.js"]).toBeGreaterThan(1_000_000);
    expect(BUNDLE_SIZE_BUDGETS["bundle.assets"]).toBeGreaterThan(1_000_000);
  });
});

describe("memory budgets", () => {
  it("returns the canonical memory budget for each metric", () => {
    expect(getMemoryBudget("memory.js_heap.startup")).toBe(
      MEMORY_BUDGETS["memory.js_heap.startup"],
    );
    expect(getMemoryBudget("memory.js_heap.idle")).toBe(
      MEMORY_BUDGETS["memory.js_heap.idle"],
    );
  });

  it("idle budget is greater than startup budget", () => {
    expect(MEMORY_BUDGETS["memory.js_heap.idle"]).toBeGreaterThan(
      MEMORY_BUDGETS["memory.js_heap.startup"],
    );
  });
});

describe("image size budgets", () => {
  it("returns the canonical image size budget for each metric", () => {
    expect(getImageSizeBudget("image.asset.max")).toBe(
      IMAGE_SIZE_BUDGETS["image.asset.max"],
    );
    expect(getImageSizeBudget("image.icon.max")).toBe(
      IMAGE_SIZE_BUDGETS["image.icon.max"],
    );
  });

  it("asset budget is greater than icon budget", () => {
    expect(IMAGE_SIZE_BUDGETS["image.asset.max"]).toBeGreaterThan(
      IMAGE_SIZE_BUDGETS["image.icon.max"],
    );
  });
});
