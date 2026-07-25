import { useCallback, useRef, useState } from "react";

import type { AnalyticsClient } from "@/core/observability/analytics-types";
import { AI_CHAT_MAX_QUESTION_LENGTH } from "@/features/ai-chat/ai-chat-config";
import type { AiChatAnswer, AiChatErrorKind, AiChatMessage } from "@/features/ai-chat/contracts";
import {
  classifyAiChatError,
  isAiChatErrorRetryable,
} from "@/features/ai-chat/services/ai-chat-errors";

export interface AskAiChatMutation {
  readonly mutateAsync: (question: string) => Promise<AiChatAnswer>;
}

interface AiChatSessionOptions {
  readonly mutation: AskAiChatMutation;
  readonly analytics: AnalyticsClient;
  readonly now: () => Date;
  readonly createId: () => string;
}

export interface AiChatSession {
  readonly messages: readonly AiChatMessage[];
  readonly isSending: boolean;
  readonly errorKind: AiChatErrorKind | null;
  readonly canRetry: boolean;
  readonly ask: (question: string) => Promise<void>;
  readonly retry: () => Promise<void>;
  readonly dismissError: () => void;
  readonly retryAfterConsent: () => Promise<void>;
}

interface QuestionExecution {
  readonly isSending: boolean;
  readonly errorKind: AiChatErrorKind | null;
  readonly failedQuestion: string | null;
  readonly execute: (question: string, attempt: "initial" | "retry") => Promise<void>;
  readonly clearError: (clearFailedQuestion?: boolean) => void;
  readonly showValidationError: () => void;
}

const useTranscript = (now: () => Date, createId: () => string) => {
  const [messages, setMessages] = useState<readonly AiChatMessage[]>([]);
  const appendMessage = useCallback(
    (role: AiChatMessage["role"], content: string, periodLabel?: string): void => {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role,
          content,
          createdAt: now().toISOString(),
          ...(periodLabel ? { periodLabel } : {}),
        },
      ]);
    },
    [createId, now],
  );

  return { messages, appendMessage };
};

const useQuestionExecution = (
  mutation: AskAiChatMutation,
  analytics: AnalyticsClient,
  appendMessage: (role: AiChatMessage["role"], content: string, periodLabel?: string) => void,
): QuestionExecution => {
  const [isSending, setIsSending] = useState(false);
  const [errorKind, setErrorKind] = useState<AiChatErrorKind | null>(null);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const clearError = useCallback((clearFailedQuestion = true): void => {
    setErrorKind(null);
    if (clearFailedQuestion) {
      setFailedQuestion(null);
    }
  }, []);

  const showValidationError = useCallback((): void => {
    setErrorKind("validation");
    setFailedQuestion(null);
  }, []);

  const execute = useCallback(
    async (question: string, attempt: "initial" | "retry"): Promise<void> => {
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      setIsSending(true);
      analytics.capture("ai.chat.question.sent", { attempt });

      try {
        const answer = await mutation.mutateAsync(question);
        appendMessage("assistant", answer.answer, answer.periodLabel ?? undefined);
        setFailedQuestion(null);
        analytics.capture("ai.chat.answer.received", {
          periodAnchored: Boolean(answer.periodLabel),
          usedTools: (answer.toolRounds ?? 0) > 0,
        });
      } catch (error) {
        const nextErrorKind = classifyAiChatError(error);
        setErrorKind(nextErrorKind);
        setFailedQuestion(question);
        analytics.capture("ai.chat.request.failed", {
          errorKind: nextErrorKind,
          retryable: isAiChatErrorRetryable(nextErrorKind),
        });
      } finally {
        inFlightRef.current = false;
        setIsSending(false);
      }
    },
    [analytics, appendMessage, mutation],
  );

  return {
    isSending,
    errorKind,
    failedQuestion,
    execute,
    clearError,
    showValidationError,
  };
};

export const useAiChatSession = ({
  mutation,
  analytics,
  now,
  createId,
}: AiChatSessionOptions): AiChatSession => {
  const transcript = useTranscript(now, createId);
  const execution = useQuestionExecution(mutation, analytics, transcript.appendMessage);

  const ask = useCallback(
    async (question: string): Promise<void> => {
      const normalized = question.trim();
      if (normalized.length === 0 || execution.isSending) {
        return;
      }
      if (normalized.length > AI_CHAT_MAX_QUESTION_LENGTH) {
        execution.showValidationError();
        return;
      }

      execution.clearError();
      transcript.appendMessage("user", normalized);
      await execution.execute(normalized, "initial");
    },
    [execution, transcript],
  );

  const retry = useCallback(async (): Promise<void> => {
    if (!execution.failedQuestion || execution.isSending) {
      return;
    }
    execution.clearError(false);
    await execution.execute(execution.failedQuestion, "retry");
  }, [execution]);

  const dismissError = useCallback((): void => {
    execution.clearError();
  }, [execution]);

  const retryAfterConsent = useCallback(async (): Promise<void> => {
    if (execution.errorKind === "consent" && execution.failedQuestion && !execution.isSending) {
      execution.clearError(false);
      await execution.execute(execution.failedQuestion, "retry");
    }
  }, [execution]);

  return {
    messages: transcript.messages,
    isSending: execution.isSending,
    errorKind: execution.errorKind,
    canRetry:
      execution.failedQuestion !== null &&
      execution.errorKind !== null &&
      isAiChatErrorRetryable(execution.errorKind),
    ask,
    retry,
    dismissError,
    retryAfterConsent,
  };
};
