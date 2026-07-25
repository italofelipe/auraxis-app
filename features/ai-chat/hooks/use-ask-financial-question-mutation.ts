import { createApiMutation } from "@/core/query/create-api-mutation";
import { aiChatService } from "@/features/ai-chat/services/ai-chat-service";

/**
 * Typed mutation for the stateless `POST /ai/chat` contract.
 */
export const useAskFinancialQuestionMutation = () => {
  return createApiMutation(
    async (question: string) => {
      return aiChatService.askFinancialQuestion({ question });
    },
    {
      retry: false,
    },
  );
};
