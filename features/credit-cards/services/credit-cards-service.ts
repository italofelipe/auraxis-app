import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  CreateCreditCardCommand,
  CreditCard,
  CreditCardBrand,
  CreditCardListResponse,
  UpdateCreditCardCommand,
} from "@/features/credit-cards/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface CreditCardPayload {
  readonly id: string;
  readonly name: string;
  readonly brand: CreditCardBrand | null;
  readonly limit_amount: number | null;
  readonly closing_day: number | null;
  readonly due_day: number | null;
  readonly last_four_digits: string | null;
}

const mapCreditCard = (payload: CreditCardPayload): CreditCard => ({
  id: payload.id,
  name: payload.name,
  brand: payload.brand,
  limitAmount: payload.limit_amount,
  closingDay: payload.closing_day,
  dueDay: payload.due_day,
  lastFourDigits: payload.last_four_digits,
});

const buildPayload = (
  command: CreateCreditCardCommand | Omit<UpdateCreditCardCommand, "creditCardId">,
) => ({
  name: command.name,
  brand: command.brand ?? null,
  limit_amount: command.limitAmount ?? null,
  closing_day: command.closingDay ?? null,
  due_day: command.dueDay ?? null,
  last_four_digits: command.lastFourDigits ?? null,
});

export const createCreditCardsService = (client: AxiosInstance) => ({
  listCreditCards: async (): Promise<CreditCardListResponse> => {
    const response = await client.get(apiContractMap.creditCardsList.path);
    const payload = unwrapEnvelopeData<{
      readonly credit_cards: CreditCardPayload[];
    }>(response.data);
    return { creditCards: payload.credit_cards.map(mapCreditCard) };
  },
  createCreditCard: async (command: CreateCreditCardCommand): Promise<CreditCard> => {
    const response = await client.post(
      apiContractMap.creditCardsCreate.path,
      buildPayload(command),
    );
    const payload = unwrapEnvelopeData<{
      readonly credit_card: CreditCardPayload;
    }>(response.data);
    return mapCreditCard(payload.credit_card);
  },
  updateCreditCard: async (command: UpdateCreditCardCommand): Promise<CreditCard> => {
    const { creditCardId, ...rest } = command;
    const response = await client.put(
      resolveApiContractPath(apiContractMap.creditCardUpdate.path, {
        credit_card_id: creditCardId,
      }),
      buildPayload(rest),
    );
    const payload = unwrapEnvelopeData<{
      readonly credit_card: CreditCardPayload;
    }>(response.data);
    return mapCreditCard(payload.credit_card);
  },
  deleteCreditCard: async (creditCardId: string): Promise<void> => {
    await client.delete(
      resolveApiContractPath(apiContractMap.creditCardDelete.path, {
        credit_card_id: creditCardId,
      }),
    );
  },
});

export const creditCardsService = createCreditCardsService(httpClient);
