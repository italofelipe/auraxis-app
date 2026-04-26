import { useQueryClient } from "@tanstack/react-query";

import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateCreditCardCommand,
  CreditCard,
  UpdateCreditCardCommand,
} from "@/features/credit-cards/contracts";
import { creditCardsService } from "@/features/credit-cards/services/credit-cards-service";

const useInvalidateCreditCards = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.root });
  };
};

export const useCreateCreditCardMutation = () => {
  const invalidate = useInvalidateCreditCards();
  return createApiMutation<CreditCard, CreateCreditCardCommand>(
    (command) => creditCardsService.createCreditCard(command),
    { onSuccess: invalidate },
  );
};

export const useUpdateCreditCardMutation = () => {
  const invalidate = useInvalidateCreditCards();
  return createApiMutation<CreditCard, UpdateCreditCardCommand>(
    (command) => creditCardsService.updateCreditCard(command),
    { onSuccess: invalidate },
  );
};

export const useDeleteCreditCardMutation = () => {
  const invalidate = useInvalidateCreditCards();
  return createApiMutation<void, string>(
    (creditCardId) => creditCardsService.deleteCreditCard(creditCardId),
    { onSuccess: invalidate },
  );
};
