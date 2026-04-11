import {
  PERFORMANCE_BUDGETS,
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
