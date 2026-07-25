import type { AiChatErrorKind } from "@/features/ai-chat/contracts";

interface ErrorLike {
  readonly status?: number;
  readonly code?: string;
  readonly message?: string;
}

const asErrorLike = (error: unknown): ErrorLike => {
  if (error === null || typeof error !== "object") {
    return {};
  }

  const candidate = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };
  return {
    status: typeof candidate.status === "number" ? candidate.status : undefined,
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    message: typeof candidate.message === "string" ? candidate.message : undefined,
  };
};

/**
 * Maps transport/backend failures to stable UI states without exposing raw
 * provider details to the user.
 */
export const classifyAiChatError = (error: unknown): AiChatErrorKind => {
  const { status, code, message } = asErrorLike(error);

  const codeKind = classifyAiChatErrorCode(code);
  if (codeKind) {
    return codeKind;
  }
  if (status === 429) {
    return "budget";
  }
  if (status === 400) {
    return "validation";
  }
  if (isTimeoutFailure(status, message)) {
    return "timeout";
  }
  if (status === 403) {
    return "entitlement";
  }
  return "server";
};

const classifyAiChatErrorCode = (code: string | undefined): AiChatErrorKind | null => {
  const kinds: Readonly<Record<string, AiChatErrorKind>> = {
    ENTITLEMENT_REQUIRED: "entitlement",
    AI_CONSENT_REQUIRED: "consent",
    AI_INSIGHT_BUDGET_EXCEEDED: "budget",
    VALIDATION_ERROR: "validation",
    ECONNABORTED: "timeout",
    ETIMEDOUT: "timeout",
  };
  return code ? (kinds[code] ?? null) : null;
};

const isTimeoutFailure = (status: number | undefined, message: string | undefined): boolean => {
  return status === 0 && Boolean(message?.toLowerCase().includes("timeout"));
};

export const isAiChatErrorRetryable = (errorKind: AiChatErrorKind): boolean => {
  return errorKind === "timeout" || errorKind === "server";
};
