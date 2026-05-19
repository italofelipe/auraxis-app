import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { CreditCardUtilizationRecord } from "@/features/credit-cards/contracts";
import { creditCardsService } from "@/features/credit-cards/services/credit-cards-service";

export interface CreditCardUtilizationQueryOptions {
  readonly enabled?: boolean;
}

export const useCreditCardUtilizationQuery = (
  creditCardId: string,
  options: CreditCardUtilizationQueryOptions = {},
) => {
  const enabled = (options.enabled ?? true) && creditCardId.length > 0;

  return createApiQuery<CreditCardUtilizationRecord>(
    queryKeys.creditCards.utilization(creditCardId),
    () => creditCardsService.getUtilization(creditCardId),
    { enabled },
  );
};
