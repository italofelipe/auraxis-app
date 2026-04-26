import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { CreditCardListResponse } from "@/features/credit-cards/contracts";
import { creditCardsService } from "@/features/credit-cards/services/credit-cards-service";

export const useCreditCardsQuery = () => {
  return createApiQuery<CreditCardListResponse>(queryKeys.creditCards.list(), () =>
    creditCardsService.listCreditCards(),
  );
};
