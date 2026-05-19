import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { CreditCardBillRecord } from "@/features/credit-cards/contracts";
import { creditCardsService } from "@/features/credit-cards/services/credit-cards-service";

export interface CreditCardBillQueryOptions {
  readonly enabled?: boolean;
}

export const useCreditCardBillQuery = (
  creditCardId: string,
  month: string,
  options: CreditCardBillQueryOptions = {},
) => {
  const enabled =
    (options.enabled ?? true) && creditCardId.length > 0 && month.length > 0;

  return createApiQuery<CreditCardBillRecord>(
    queryKeys.creditCards.bill(creditCardId, month),
    () => creditCardsService.getBill(creditCardId, { month }),
    { enabled },
  );
};
