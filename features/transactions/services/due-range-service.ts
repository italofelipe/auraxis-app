import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  DueRangeFilters,
  DueRangeResponse,
  DueTransactionRecord,
} from "@/features/transactions/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface DuePayload {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: "income" | "expense";
  readonly due_date: string;
  readonly status: DueTransactionRecord["status"];
  readonly tag_id: string | null;
  readonly account_id: string | null;
  readonly credit_card_id: string | null;
  readonly is_recurring: boolean;
}

interface DueRangePayload {
  readonly transactions: readonly DuePayload[];
  readonly total: number;
  readonly page: number;
  readonly per_page: number;
  readonly counts: {
    readonly total: number;
    readonly overdue: number;
    readonly pending: number;
  };
}

const mapItem = (item: DuePayload): DueTransactionRecord => {
  return {
    id: item.id,
    title: item.title,
    amount: item.amount,
    type: item.type,
    dueDate: item.due_date,
    status: item.status,
    tagId: item.tag_id,
    accountId: item.account_id,
    creditCardId: item.credit_card_id,
    isRecurring: item.is_recurring,
  };
};

const mapResponse = (payload: DueRangePayload): DueRangeResponse => {
  return {
    transactions: payload.transactions.map(mapItem),
    total: payload.total,
    page: payload.page,
    perPage: payload.per_page,
    counts: {
      total: payload.counts.total,
      overdue: payload.counts.overdue,
      pending: payload.counts.pending,
    },
  };
};

const buildParams = (
  filters: DueRangeFilters,
): Record<string, string | number | undefined> => {
  return {
    start_date: filters.startDate,
    end_date: filters.endDate,
    order_by: filters.orderBy,
    page: filters.page,
    per_page: filters.perPage,
  };
};

export const createDueRangeService = (client: AxiosInstance) => {
  return {
    list: async (filters: DueRangeFilters = {}): Promise<DueRangeResponse> => {
      const response = await client.get(
        apiContractMap.transactionsDueRange.path,
        { params: buildParams(filters) },
      );
      return mapResponse(unwrapEnvelopeData<DueRangePayload>(response.data));
    },
  };
};

export const dueRangeService = createDueRangeService(httpClient);
