import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  CreateCreditCardCommand,
  CreditCard,
  CreditCardBillQuery,
  CreditCardBillRecord,
  CreditCardBillTransaction,
  CreditCardBrand,
  CreditCardListResponse,
  CreditCardUtilizationRecord,
  UpdateCreditCardCommand,
} from "@/features/credit-cards/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

type NumericPayload = number | string;

interface CreditCardPayload {
  readonly id: string;
  readonly name: string;
  readonly brand: CreditCardBrand | null;
  readonly limit_amount: NumericPayload | null;
  readonly closing_day: number | null;
  readonly due_day: number | null;
  readonly last_four_digits: string | null;
  readonly bank?: string | null;
  readonly description?: string | null;
  readonly benefits?: readonly string[] | null;
  readonly validity_date?: string | null;
  readonly created_at?: string | null;
  readonly updated_at?: string | null;
}

interface CreditCardBillCyclePayload {
  readonly start_date: string;
  readonly end_date: string;
  readonly due_date: string;
  readonly status: "open" | "closed" | "paid" | string;
}

interface CreditCardBillTransactionPayload {
  readonly id: string;
  readonly title: string;
  readonly amount: NumericPayload;
  readonly due_date: string | null;
  readonly status: string;
  readonly type: string;
}

interface CreditCardBillPayload {
  readonly cycle: CreditCardBillCyclePayload;
  readonly transactions: readonly CreditCardBillTransactionPayload[];
  readonly total_amount: NumericPayload;
  readonly paid_amount: NumericPayload;
  readonly pending_amount: NumericPayload;
}

interface CreditCardUtilizationPayload {
  readonly cycle: CreditCardBillCyclePayload;
  readonly committed_amount: NumericPayload;
  readonly available_amount: NumericPayload | null;
  readonly limit_amount: NumericPayload | null;
  readonly utilization_pct: number | null;
}

const parseNumericPayload = (value: NumericPayload): number => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapNullableNumericPayload = (value: NumericPayload | null): number | null => {
  if (value === null) {
    return null;
  }
  return parseNumericPayload(value);
};

const mapCycle = (payload: CreditCardBillCyclePayload) => ({
  startDate: payload.start_date,
  endDate: payload.end_date,
  dueDate: payload.due_date,
  status: payload.status,
});

const mapBillTransaction = (
  payload: CreditCardBillTransactionPayload,
): CreditCardBillTransaction => ({
  id: payload.id,
  title: payload.title,
  amount: parseNumericPayload(payload.amount),
  dueDate: payload.due_date,
  status: payload.status,
  type: payload.type,
});

const mapBill = (payload: CreditCardBillPayload): CreditCardBillRecord => ({
  cycle: mapCycle(payload.cycle),
  transactions: payload.transactions.map(mapBillTransaction),
  totalAmount: parseNumericPayload(payload.total_amount),
  paidAmount: parseNumericPayload(payload.paid_amount),
  pendingAmount: parseNumericPayload(payload.pending_amount),
});

const mapUtilization = (
  payload: CreditCardUtilizationPayload,
): CreditCardUtilizationRecord => ({
  cycle: mapCycle(payload.cycle),
  committedAmount: parseNumericPayload(payload.committed_amount),
  availableAmount: mapNullableNumericPayload(payload.available_amount),
  limitAmount: mapNullableNumericPayload(payload.limit_amount),
  utilizationPct: payload.utilization_pct,
});

const mapCreditCard = (payload: CreditCardPayload): CreditCard => ({
  id: payload.id,
  name: payload.name,
  brand: payload.brand,
  limitAmount: mapNullableNumericPayload(payload.limit_amount),
  closingDay: payload.closing_day,
  dueDay: payload.due_day,
  lastFourDigits: payload.last_four_digits,
  bank: payload.bank ?? null,
  description: payload.description ?? null,
  benefits: payload.benefits ?? [],
  validityDate: payload.validity_date ?? null,
  createdAt: payload.created_at ?? null,
  updatedAt: payload.updated_at ?? null,
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
  bank: command.bank ?? null,
  description: command.description ?? null,
  benefits: command.benefits ?? null,
  validity_date: command.validityDate ?? null,
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
  getBill: async (
    creditCardId: string,
    query: CreditCardBillQuery = {},
  ): Promise<CreditCardBillRecord> => {
    const response = await client.get(
      resolveApiContractPath(apiContractMap.creditCardBill.path, {
        credit_card_id: creditCardId,
      }),
      { params: query },
    );
    return mapBill(unwrapEnvelopeData<CreditCardBillPayload>(response.data));
  },
  getUtilization: async (
    creditCardId: string,
  ): Promise<CreditCardUtilizationRecord> => {
    const response = await client.get(
      resolveApiContractPath(apiContractMap.creditCardUtilization.path, {
        credit_card_id: creditCardId,
      }),
    );
    return mapUtilization(
      unwrapEnvelopeData<CreditCardUtilizationPayload>(response.data),
    );
  },
});

export const creditCardsService = createCreditCardsService(httpClient);
