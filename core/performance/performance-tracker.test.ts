import type { PerformanceBudgetMap } from "@/core/performance/performance-budgets";
import { createPerformanceTracker } from "@/core/performance/performance-tracker";

describe("performance tracker", () => {
  it("records durations and logs when a budget is exceeded", () => {
    const logger = {
      log: jest.fn(),
    };
    const budgets: PerformanceBudgetMap = {
      "startup.total": 100,
      "runtime.revalidation": 150,
      "runtime.reachability": 50,
    };
    const now = jest
      .fn()
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(170);
    const tracker = createPerformanceTracker({
      logger,
      budgets,
      now: () => now(),
      shouldTrack: () => true,
    });

    tracker.start("startup.total");
    const measurement = tracker.end("startup.total", { source: "startup" });

    expect(measurement).toEqual({
      metric: "startup.total",
      durationMs: 160,
      budgetMs: 100,
      exceeded: true,
    });

    expect(logger.log).toHaveBeenNthCalledWith(
      1,
      "performance.measurement_recorded",
      {
        context: {
          source: "startup",
          metric: "startup.total",
          durationMs: 160,
          budgetMs: 100,
          exceeded: true,
        },
      },
    );
    expect(logger.log).toHaveBeenNthCalledWith(
      2,
      "performance.budget_exceeded",
      {
        level: "warn",
        context: {
          source: "startup",
          metric: "startup.total",
          durationMs: 160,
          budgetMs: 100,
          exceeded: true,
        },
      },
    );
  });

  it("returns null when the measurement was not started", () => {
    const logger = { log: jest.fn() };
    const now = jest.fn().mockReturnValue(10);
    const tracker = createPerformanceTracker({
      logger,
      now: () => now(),
      shouldTrack: () => true,
    });

    expect(
      tracker.end("runtime.revalidation"),
    ).toBeNull();
    expect(logger.log).not.toHaveBeenCalled();
  });
});
