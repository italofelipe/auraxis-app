import {
  markShownThisSession,
  resetPaymentAssistantSessionForTests,
  shouldAutoOpenAssistant,
  wasShownThisSession,
} from "@/features/payments-assistant/services/payment-assistant-session";

describe("payment-assistant session flag", () => {
  beforeEach(() => {
    resetPaymentAssistantSessionForTests();
  });

  it("reports not shown before being marked", () => {
    expect(wasShownThisSession()).toBe(false);
  });

  it("persists the shown flag for the session", () => {
    markShownThisSession();
    expect(wasShownThisSession()).toBe(true);
  });
});

describe("shouldAutoOpenAssistant", () => {
  const base = {
    startupReady: true,
    isPremium: true,
    shownThisSession: false,
    candidateCount: 3,
  };

  it("opens when all conditions are met", () => {
    expect(shouldAutoOpenAssistant(base)).toBe(true);
  });

  it("stays closed before startup is ready", () => {
    expect(shouldAutoOpenAssistant({ ...base, startupReady: false })).toBe(false);
  });

  it("stays closed for non-Premium users", () => {
    expect(shouldAutoOpenAssistant({ ...base, isPremium: false })).toBe(false);
  });

  it("stays closed when already shown this session", () => {
    expect(shouldAutoOpenAssistant({ ...base, shownThisSession: true })).toBe(false);
  });

  it("stays closed when there are no candidates", () => {
    expect(shouldAutoOpenAssistant({ ...base, candidateCount: 0 })).toBe(false);
  });
});
