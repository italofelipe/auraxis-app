import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  CreateTransactionCommand,
  DeletedTransactionListResponse,
  DeletedTransactionRecord,
  TransactionCollection,
  TransactionListQuery,
  TransactionPagination,
  TransactionRecord,
  TransactionSummary,
  TransactionSummaryQuery,
  UpdateTransactionCommand,
} from "@/features/transactions/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface TransactionPayload {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: TransactionRecord["type"];
  readonly due_date: string;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly description: string | null;
  readonly observation: string | null;
  readonly is_recurring: boolean;
  readonly is_installment: boolean;
  readonly installment_count: number | null;
  readonly tag_id: string | null;
  readonly account_id: string | null;
  readonly credit_card_id: string | null;
  readonly status: TransactionRecord["status"];
  readonly currency: string;
  readonly source: string;
  readonly external_id: string | null;
  readonly bank_name: string | null;
  readonly installment_group_id: string | null;
  readonly paid_at: string | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const buildFallbackPagination = (totalFallback: number): TransactionPagination => ({
  total: totalFallback,
  page: 1,
  perPage: totalFallback || 10,
  pages: totalFallback > 0 ? 1 : 0,
  hasNextPage: false,
});

const mapTransaction = (payload: TransactionPayload): TransactionRecord => {
  return {
    id: payload.id,
    title: payload.title,
    amount: payload.amount,
    type: payload.type,
    dueDate: payload.due_date,
    startDate: payload.start_date,
    endDate: payload.end_date,
    description: payload.description,
    observation: payload.observation,
    isRecurring: payload.is_recurring,
    isInstallment: payload.is_installment,
    installmentCount: payload.installment_count,
    tagId: payload.tag_id,
    accountId: payload.account_id,
    creditCardId: payload.credit_card_id,
    status: payload.status,
    currency: payload.currency,
    source: payload.source,
    externalId: payload.external_id,
    bankName: payload.bank_name,
    installmentGroupId: payload.installment_group_id,
    paidAt: payload.paid_at,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  };
};

const extractPaginationRecord = (
  rawEnvelope: unknown,
): Record<string, unknown> | null => {
  if (!isRecord(rawEnvelope)) {
    return null;
  }
  const meta = rawEnvelope.meta;
  if (!isRecord(meta)) {
    return null;
  }
  const pagination = meta.pagination;
  return isRecord(pagination) ? pagination : null;
};

const resolvePagination = (
  rawEnvelope: unknown,
  totalFallback: number,
): TransactionPagination => {
  const pagination = extractPaginationRecord(rawEnvelope);
  if (!pagination) {
    return buildFallbackPagination(totalFallback);
  }
  return {
    total: Number(pagination.total ?? totalFallback),
    page: Number(pagination.page ?? 1),
    perPage: Number(pagination.per_page ?? (totalFallback || 10)),
    pages:
      pagination.pages === undefined || pagination.pages === null
        ? null
        : Number(pagination.pages),
    hasNextPage:
      pagination.has_next_page === undefined
        ? null
        : Boolean(pagination.has_next_page),
  };
};

const buildTransactionPayload = (
  command: CreateTransactionCommand | UpdateTransactionCommand,
): Record<string, unknown> => {
  return {
    title: command.title,
    amount: command.amount,
    type: command.type,
    due_date: command.dueDate,
    start_date: command.startDate,
    end_date: command.endDate,
    description: command.description,
    observation: command.observation,
    is_recurring: command.isRecurring,
    is_installment: command.isInstallment,
    installment_count: command.installmentCount,
    tag_id: command.tagId,
    account_id: command.accountId,
    credit_card_id: command.creditCardId,
    status: command.status,
    currency: command.currency,
    source: command.source,
    external_id: command.externalId,
    bank_name: command.bankName,
    paid_at: command.paidAt,
  };
};

const extractTransactionFromMutation = (rawEnvelope: unknown): TransactionRecord => {
  const payload = unwrapEnvelopeData<{
    readonly transaction?: TransactionPayload;
    readonly transactions?: TransactionPayload[];
  }>(
    rawEnvelope as
      | {
          readonly data: {
            readonly transaction?: TransactionPayload;
            readonly transactions?: TransactionPayload[];
          };
        }
      | {
          readonly transaction?: TransactionPayload;
          readonly transactions?: TransactionPayload[];
        },
  );

  if (payload.transaction) {
    return mapTransaction(payload.transaction);
  }

  const firstTransaction = payload.transactions?.[0];
  if (firstTransaction) {
    return mapTransaction(firstTransaction);
  }

  throw new Error("Transaction mutation response without transaction payload.");
};

const fetchDeletedTransactions = async (
  client: AxiosInstance,
): Promise<DeletedTransactionListResponse> => {
  const response = await client.get(apiContractMap.transactionsDeleted.path);
  const payload = unwrapEnvelopeData<{
    readonly transactions?: (TransactionPayload & { deleted_at?: string | null })[];
  }>(response.data);
  const transactions: readonly DeletedTransactionRecord[] = (
    payload.transactions ?? []
  ).map((item) => ({
    ...mapTransaction(item),
    deletedAt: item.deleted_at ?? null,
  }));
  return { transactions };
};

const restoreTransactionRequest = async (
  client: AxiosInstance,
  transactionId: string,
): Promise<TransactionRecord> => {
  const response = await client.patch(
    resolveApiContractPath(apiContractMap.transactionRestore.path, {
      transaction_id: transactionId,
    }),
  );
  const payload = unwrapEnvelopeData<{
    readonly transaction?: TransactionPayload;
  }>(response.data);
  if (!payload.transaction) {
    throw new Error("Transacao restaurada veio sem payload.");
  }
  return mapTransaction(payload.transaction);
};

const listTransactionsRequest = async (
  client: AxiosInstance,
  query: TransactionListQuery,
): Promise<TransactionCollection> => {
  const response = await client.get(apiContractMap.transactionsList.path, {
    params: {
      page: query.page,
      per_page: query.perPage,
      type: query.type,
      status: query.status,
      start_date: query.startDate,
      end_date: query.endDate,
      tag_id: query.tagId,
      account_id: query.accountId,
      credit_card_id: query.creditCardId,
    },
  });
  const payload = unwrapEnvelopeData<{ readonly transactions: TransactionPayload[] }>(
    response.data,
  );
  const transactions = payload.transactions.map(mapTransaction);
  return {
    transactions,
    pagination: resolvePagination(response.data, transactions.length),
  };
};

const getSummaryRequest = async (
  client: AxiosInstance,
  query: TransactionSummaryQuery,
): Promise<TransactionSummary> => {
  const response = await client.get(apiContractMap.transactionsSummary.path, {
    params: {
      month: query.month,
      page: query.page,
      per_page: query.perPage,
    },
  });
  const payload = unwrapEnvelopeData<{
    readonly month: string;
    readonly income_total: string;
    readonly expense_total: string;
    readonly items: TransactionPayload[];
  }>(response.data);
  const items = payload.items.map(mapTransaction);
  return {
    month: payload.month,
    incomeTotal: payload.income_total,
    expenseTotal: payload.expense_total,
    items,
    pagination: resolvePagination(response.data, items.length),
  };
};

export const createTransactionsService = (client: AxiosInstance) => {
  return {
    listTransactions: (query: TransactionListQuery = {}) =>
      listTransactionsRequest(client, query),
    getTransaction: async (transactionId: string): Promise<TransactionRecord> => {
      const response = await client.get(
        resolveApiContractPath(apiContractMap.transactionDetail.path, {
          transaction_id: transactionId,
        }),
      );
      const payload = unwrapEnvelopeData<{ readonly transaction: TransactionPayload }>(
        response.data,
      );
      return mapTransaction(payload.transaction);
    },
    createTransaction: async (
      command: CreateTransactionCommand,
    ): Promise<TransactionRecord> => {
      const response = await client.post(
        apiContractMap.transactionsCreate.path,
        buildTransactionPayload(command),
      );
      return extractTransactionFromMutation(response.data);
    },
    updateTransaction: async (
      transactionId: string,
      command: UpdateTransactionCommand,
    ): Promise<TransactionRecord> => {
      const response = await client.put(
        resolveApiContractPath(apiContractMap.transactionUpdate.path, {
          transaction_id: transactionId,
        }),
        buildTransactionPayload(command),
      );
      return extractTransactionFromMutation(response.data);
    },
    deleteTransaction: async (transactionId: string): Promise<void> => {
      await client.delete(
        resolveApiContractPath(apiContractMap.transactionDelete.path, {
          transaction_id: transactionId,
        }),
      );
    },
    getSummary: (query: TransactionSummaryQuery) =>
      getSummaryRequest(client, query),
    listDeleted: () => fetchDeletedTransactions(client),
    restoreTransaction: (transactionId: string) =>
      restoreTransactionRequest(client, transactionId),
  };
};

export const transactionsService = createTransactionsService(httpClient);
