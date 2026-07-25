import {
  classifyAiChatError,
  isAiChatErrorRetryable,
} from "@/features/ai-chat/services/ai-chat-errors";

describe("aiChatErrors", () => {
  it.each([
    [{ code: "ENTITLEMENT_REQUIRED", status: 403 }, "entitlement"],
    [{ code: "AI_CONSENT_REQUIRED", status: 403 }, "consent"],
    [{ code: "AI_INSIGHT_BUDGET_EXCEEDED", status: 429 }, "budget"],
    [{ code: "VALIDATION_ERROR", status: 400 }, "validation"],
    [{ code: "ECONNABORTED", status: 0 }, "timeout"],
    [{ code: "ETIMEDOUT", status: 0 }, "timeout"],
    [{ status: 429 }, "budget"],
    [{ status: 400 }, "validation"],
    [{ status: 0, message: "timeout of 45000ms exceeded" }, "timeout"],
    [{ status: 403 }, "entitlement"],
    [{ status: 500 }, "server"],
    [null, "server"],
  ] as const)("classifica %p como %s", (error, expected) => {
    expect(classifyAiChatError(error)).toBe(expected);
  });

  it("permite retry somente para falhas transitórias", () => {
    expect(isAiChatErrorRetryable("timeout")).toBe(true);
    expect(isAiChatErrorRetryable("server")).toBe(true);
    expect(isAiChatErrorRetryable("budget")).toBe(false);
    expect(isAiChatErrorRetryable("consent")).toBe(false);
  });
});
