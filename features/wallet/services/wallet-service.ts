import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  CreateWalletEntryCommand,
  CreateWalletOperationCommand,
  DeleteWalletOperationCommand,
  UpdateWalletEntryCommand,
  WalletCollection,
  WalletEntry,
  WalletListQuery,
  WalletOperation,
  WalletOperationKind,
  WalletOperationsListResponse,
  WalletOperationsPosition,
  WalletValuationSummary,
} from "@/features/wallet/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface WalletEntryPayload {
  readonly id: string;
  readonly name: string;
  readonly value: number | null;
  readonly estimated_value_on_create_date: number | null;
  readonly ticker: string | null;
  readonly quantity: number | null;
  readonly asset_class: string;
  readonly annual_rate: number | null;
  readonly target_withdraw_date: string | null;
  readonly register_date: string;
  readonly should_be_on_wallet: boolean;
}

interface WalletPayload {
  readonly items: WalletEntryPayload[];
  readonly total: number;
  readonly returned_items: number;
  readonly limit: number;
  readonly has_more: boolean;
}

const mapEntry = (item: WalletEntryPayload): WalletEntry => ({
  id: item.id,
  name: item.name,
  value: item.value,
  estimatedValueOnCreateDate: item.estimated_value_on_create_date,
  ticker: item.ticker,
  quantity: item.quantity,
  assetClass: item.asset_class,
  annualRate: item.annual_rate,
  targetWithdrawDate: item.target_withdraw_date,
  registerDate: item.register_date,
  shouldBeOnWallet: item.should_be_on_wallet,
});

const mapWalletPayload = (payload: WalletPayload): WalletCollection => {
  return {
    items: payload.items.map(mapEntry),
    total: payload.total,
    returnedItems: payload.returned_items,
    limit: payload.limit,
    hasMore: payload.has_more,
  };
};

const buildCreatePayload = (command: CreateWalletEntryCommand) => ({
  name: command.name,
  asset_class: command.assetClass,
  value: command.value ?? null,
  ticker: command.ticker ?? null,
  quantity: command.quantity ?? null,
  annual_rate: command.annualRate ?? null,
  target_withdraw_date: command.targetWithdrawDate ?? null,
  register_date: command.registerDate ?? new Date().toISOString().slice(0, 10),
});

interface WalletOperationPayload {
  readonly id: string;
  readonly kind: WalletOperationKind;
  readonly quantity: number;
  readonly unit_price: number;
  readonly total_value: number;
  readonly executed_at: string;
  readonly notes: string | null;
}

const mapOperation = (payload: WalletOperationPayload): WalletOperation => ({
  id: payload.id,
  kind: payload.kind,
  quantity: payload.quantity,
  unitPrice: payload.unit_price,
  totalValue: payload.total_value,
  executedAt: payload.executed_at,
  notes: payload.notes,
});

const buildUpdatePayload = (command: UpdateWalletEntryCommand) => {
  const payload: Record<string, unknown> = {};
  if (command.name !== undefined) {payload.name = command.name;}
  if (command.assetClass !== undefined) {payload.asset_class = command.assetClass;}
  if (command.value !== undefined) {payload.value = command.value;}
  if (command.ticker !== undefined) {payload.ticker = command.ticker;}
  if (command.quantity !== undefined) {payload.quantity = command.quantity;}
  if (command.annualRate !== undefined) {payload.annual_rate = command.annualRate;}
  if (command.targetWithdrawDate !== undefined) {
    payload.target_withdraw_date = command.targetWithdrawDate;
  }
  if (command.shouldBeOnWallet !== undefined) {
    payload.should_be_on_wallet = command.shouldBeOnWallet;
  }
  return payload;
};

interface ValuationPayloadShape {
  readonly summary?: {
    readonly total_current_value?: number | string;
    readonly total_invested_amount?: number | string;
    readonly total_profit_loss_percent?: number | string;
    readonly total_investments?: number;
  };
  readonly total_current_value?: number | string;
  readonly total_invested_amount?: number | string;
  readonly total_profit_loss_percent?: number | string;
  readonly total_investments?: number;
}

const toNumeric = (value: number | string | undefined): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const mapValuation = (data: unknown): WalletValuationSummary => {
  const payload = unwrapEnvelopeData<ValuationPayloadShape>(
    data as ValuationPayloadShape,
  );
  const summary = payload.summary ?? payload;
  return {
    totalCurrentValue: toNumeric(summary.total_current_value),
    totalInvestedAmount: toNumeric(summary.total_invested_amount),
    totalProfitLossPercent: toNumeric(summary.total_profit_loss_percent),
    totalInvestments: summary.total_investments ?? 0,
  };
};

const createEntriesService = (client: AxiosInstance) => ({
  listEntries: async (
    query: WalletListQuery = {},
  ): Promise<WalletCollection> => {
    const response = await client.get(apiContractMap.walletSummary.path, {
      params: { page: query.page, per_page: query.perPage },
    });
    return mapWalletPayload(unwrapEnvelopeData<WalletPayload>(response.data));
  },
  createEntry: async (command: CreateWalletEntryCommand): Promise<WalletEntry> => {
    const response = await client.post(
      apiContractMap.walletCreate.path,
      buildCreatePayload(command),
    );
    const payload = unwrapEnvelopeData<{ readonly entry: WalletEntryPayload }>(
      response.data,
    );
    return mapEntry(payload.entry);
  },
  updateEntry: async (command: UpdateWalletEntryCommand): Promise<WalletEntry> => {
    const response = await client.patch(
      resolveApiContractPath(apiContractMap.walletUpdate.path, {
        investment_id: command.entryId,
      }),
      buildUpdatePayload(command),
    );
    const payload = unwrapEnvelopeData<{ readonly entry: WalletEntryPayload }>(
      response.data,
    );
    return mapEntry(payload.entry);
  },
  deleteEntry: async (entryId: string): Promise<void> => {
    await client.delete(
      resolveApiContractPath(apiContractMap.walletDelete.path, {
        investment_id: entryId,
      }),
    );
  },
});

const createOperationsService = (client: AxiosInstance) => ({
  listOperations: async (
    entryId: string,
  ): Promise<WalletOperationsListResponse> => {
    const response = await client.get(
      resolveApiContractPath(apiContractMap.walletOperationsList.path, {
        investment_id: entryId,
      }),
    );
    const payload = unwrapEnvelopeData<{
      readonly operations: WalletOperationPayload[];
      readonly count?: number;
    }>(response.data);
    const operations = payload.operations.map(mapOperation);
    return { operations, count: payload.count ?? operations.length };
  },
  createOperation: async (
    command: CreateWalletOperationCommand,
  ): Promise<WalletOperation> => {
    const response = await client.post(
      resolveApiContractPath(apiContractMap.walletOperationCreate.path, {
        investment_id: command.entryId,
      }),
      {
        kind: command.kind,
        quantity: command.quantity,
        unit_price: command.unitPrice,
        executed_at: command.executedAt,
        notes: command.notes ?? null,
      },
    );
    const payload = unwrapEnvelopeData<{
      readonly operation: WalletOperationPayload;
    }>(response.data);
    return mapOperation(payload.operation);
  },
  deleteOperation: async (
    command: DeleteWalletOperationCommand,
  ): Promise<void> => {
    await client.delete(
      resolveApiContractPath(apiContractMap.walletOperationDelete.path, {
        investment_id: command.entryId,
        operation_id: command.operationId,
      }),
    );
  },
  getValuation: async (): Promise<WalletValuationSummary> => {
    const response = await client.get(apiContractMap.walletValuation.path);
    return mapValuation(response.data);
  },
  getOperationsPosition: async (
    entryId: string,
  ): Promise<WalletOperationsPosition> => {
    const response = await client.get(
      resolveApiContractPath(apiContractMap.walletOperationsPosition.path, {
        investment_id: entryId,
      }),
    );
    const payload = unwrapEnvelopeData<{
      readonly entry_id?: string;
      readonly current_quantity?: number;
      readonly average_price?: number;
      readonly invested_amount?: number;
      readonly realized_profit?: number;
    }>(response.data);
    return {
      entryId: payload.entry_id ?? entryId,
      currentQuantity: payload.current_quantity ?? 0,
      averagePrice: payload.average_price ?? 0,
      investedAmount: payload.invested_amount ?? 0,
      realizedProfit: payload.realized_profit ?? 0,
    };
  },
});

export const createWalletService = (client: AxiosInstance) => ({
  ...createEntriesService(client),
  ...createOperationsService(client),
});

export const walletService = createWalletService(httpClient);
