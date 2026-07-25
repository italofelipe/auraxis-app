import type { AxiosInstance } from "axios";

import { ApiError } from "@/core/http/api-error";
import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import {
  AI_CHAT_MAX_QUESTION_LENGTH,
  AI_CHAT_REQUEST_TIMEOUT_MS,
} from "@/features/ai-chat/ai-chat-config";
import type { AiChatAnswer, AskFinancialQuestionCommand } from "@/features/ai-chat/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface AiChatAnswerPayload {
  readonly answer?: unknown;
  readonly model?: unknown;
  readonly tokens_used?: unknown;
  readonly cost_usd?: unknown;
  readonly period_label?: unknown;
  readonly tool_rounds?: unknown;
}

const readRequiredString = (value: unknown, fieldName: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  throw new ApiError({
    message: `Invalid AI chat response: ${fieldName}.`,
    status: 0,
    code: "INVALID_RESPONSE",
  });
};

const readFiniteNumber = (value: unknown, fallback = 0): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const readNullableString = (value: unknown): string | null => {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
};

const readNullableNumber = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export const normalizeAiChatQuestion = (question: string): string => {
  const normalized = question.trim();
  if (normalized.length === 0 || normalized.length > AI_CHAT_MAX_QUESTION_LENGTH) {
    throw new ApiError({
      message: "Pergunta invalida.",
      status: 400,
      code: "VALIDATION_ERROR",
    });
  }
  return normalized;
};

const mapAnswer = (payload: AiChatAnswerPayload): AiChatAnswer => {
  return {
    answer: readRequiredString(payload.answer, "answer"),
    model: readRequiredString(payload.model, "model"),
    tokensUsed: readFiniteNumber(payload.tokens_used),
    costUsd: readFiniteNumber(payload.cost_usd),
    periodLabel: readNullableString(payload.period_label),
    toolRounds: readNullableNumber(payload.tool_rounds),
  };
};

export const createAiChatService = (client: AxiosInstance) => {
  return {
    askFinancialQuestion: async (command: AskFinancialQuestionCommand): Promise<AiChatAnswer> => {
      const question = normalizeAiChatQuestion(command.question);
      const response = await client.post(
        apiContractMap.aiChatAsk.path,
        { question },
        { timeout: AI_CHAT_REQUEST_TIMEOUT_MS },
      );

      return mapAnswer(unwrapEnvelopeData<AiChatAnswerPayload>(response.data));
    },
  };
};

export const aiChatService = createAiChatService(httpClient);
