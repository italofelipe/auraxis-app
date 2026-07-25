import { useCallback, useState } from "react";

import { useAnalytics } from "@/core/observability/use-analytics";
import { AI_CHAT_ENTITLEMENT, AI_CHAT_FEATURE_FLAG_KEY } from "@/features/ai-chat/ai-chat-config";
import type { AiChatErrorKind, AiChatMessage } from "@/features/ai-chat/contracts";
import {
  useAiChatSession,
  type AskAiChatMutation,
} from "@/features/ai-chat/hooks/use-ai-chat-session";
import { useAskFinancialQuestionMutation } from "@/features/ai-chat/hooks/use-ask-financial-question-mutation";
import { classifyAiChatError } from "@/features/ai-chat/services/ai-chat-errors";
import { useFeatureAccess } from "@/features/entitlements/hooks/use-feature-access";
import { useAiInsightConsent } from "@/features/insights/hooks/use-ai-insight-consent";
import { isFeatureEnabled } from "@/shared/feature-flags";

export interface UseAiChatControllerOptions {
  readonly mutation?: AskAiChatMutation;
  readonly now?: () => Date;
  readonly createId?: () => string;
}

export interface AiChatController {
  readonly isEnabled: boolean;
  readonly isOpen: boolean;
  readonly isPremiumLoading: boolean;
  readonly hasPremiumAccess: boolean;
  readonly isConsentHydrated: boolean;
  readonly hasConsent: boolean;
  readonly isGrantingConsent: boolean;
  readonly consentErrorKind: AiChatErrorKind | null;
  readonly messages: readonly AiChatMessage[];
  readonly isSending: boolean;
  readonly errorKind: AiChatErrorKind | null;
  readonly canRetry: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly ask: (question: string) => Promise<void>;
  readonly retry: () => Promise<void>;
  readonly dismissError: () => void;
  readonly grantConsent: () => Promise<void>;
}

let messageSequence = 0;

const createDefaultMessageId = (): string => {
  messageSequence += 1;
  return `ai-chat-message-${messageSequence}`;
};

const defaultNow = (): Date => new Date();

/**
 * Owns the in-memory transcript and all gates for the global mobile AI chat.
 *
 * The backend is single-turn/stateless; keeping the transcript here preserves
 * it while the sheet opens and closes, and naturally clears it on logout when
 * the private layout unmounts.
 */
export const useAiChatController = (options: UseAiChatControllerOptions = {}): AiChatController => {
  const analytics = useAnalytics();
  const isEnabled = isFeatureEnabled(AI_CHAT_FEATURE_FLAG_KEY);
  const premiumAccess = useFeatureAccess(AI_CHAT_ENTITLEMENT, isEnabled);
  const consent = useAiInsightConsent({
    enabled: isEnabled && !premiumAccess.isLoading && premiumAccess.hasAccess,
  });
  const defaultMutation = useAskFinancialQuestionMutation();
  const mutation = options.mutation ?? defaultMutation;
  const now = options.now ?? defaultNow;
  const createId = options.createId ?? createDefaultMessageId;

  const [isOpen, setIsOpen] = useState(false);
  const [isGrantingConsent, setIsGrantingConsent] = useState(false);
  const [consentErrorKind, setConsentErrorKind] = useState<AiChatErrorKind | null>(null);
  const session = useAiChatSession({ mutation, analytics, now, createId });

  const open = useCallback((): void => {
    setIsOpen(true);
    analytics.capture("ai.chat.opened", {
      hasPremiumAccess: premiumAccess.hasAccess,
    });
  }, [analytics, premiumAccess.hasAccess]);

  const close = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const grantConsent = useCallback(async (): Promise<void> => {
    if (isGrantingConsent) {
      return;
    }

    setConsentErrorKind(null);
    setIsGrantingConsent(true);
    try {
      await consent.grantConsent();
      await session.retryAfterConsent();
    } catch (error) {
      setConsentErrorKind(classifyAiChatError(error));
    } finally {
      setIsGrantingConsent(false);
    }
  }, [consent, isGrantingConsent, session]);

  return {
    isEnabled,
    isOpen,
    isPremiumLoading: premiumAccess.isLoading,
    hasPremiumAccess: premiumAccess.hasAccess,
    isConsentHydrated: consent.isHydrated,
    hasConsent: consent.hasConsent,
    isGrantingConsent,
    consentErrorKind,
    messages: session.messages,
    isSending: session.isSending,
    errorKind: session.errorKind,
    canRetry: session.canRetry,
    open,
    close,
    ask: session.ask,
    retry: session.retry,
    dismissError: session.dismissError,
    grantConsent,
  };
};
