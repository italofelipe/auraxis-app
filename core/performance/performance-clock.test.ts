import { now } from "@/core/performance/performance-clock";

const setPerformance = (value: Performance | undefined): void => {
  Object.defineProperty(globalThis, "performance", {
    value,
    configurable: true,
    writable: true,
  });
};

describe("performance clock", () => {
  const originalPerformance = globalThis.performance;

  afterEach(() => {
    setPerformance(originalPerformance);
    jest.restoreAllMocks();
  });

  it("prefers performance.now when available", () => {
    const mockNow = jest.fn().mockReturnValue(128.5);
    setPerformance({ now: mockNow } as unknown as Performance);

    expect(now()).toBe(128.5);
    expect(mockNow).toHaveBeenCalledTimes(1);
  });

  it("falls back to Date.now when performance.now is unavailable", () => {
    setPerformance(undefined);
    jest.spyOn(Date, "now").mockReturnValue(902);

    expect(now()).toBe(902);
  });
});
