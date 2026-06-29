import { resolveSwipeOutcome } from "@/features/payments-assistant/services/payment-assistant-swipe";

describe("resolveSwipeOutcome", () => {
  const THRESHOLD = 120;

  it("returns 'pay' when swiped right past the threshold", () => {
    expect(resolveSwipeOutcome(150, THRESHOLD)).toBe("pay");
    expect(resolveSwipeOutcome(THRESHOLD, THRESHOLD)).toBe("pay");
  });

  it("returns 'delete' when swiped left past the threshold", () => {
    expect(resolveSwipeOutcome(-150, THRESHOLD)).toBe("delete");
    expect(resolveSwipeOutcome(-THRESHOLD, THRESHOLD)).toBe("delete");
  });

  it("returns 'none' for travel short of the threshold (snap back)", () => {
    expect(resolveSwipeOutcome(40, THRESHOLD)).toBe("none");
    expect(resolveSwipeOutcome(-40, THRESHOLD)).toBe("none");
    expect(resolveSwipeOutcome(0, THRESHOLD)).toBe("none");
  });
});
