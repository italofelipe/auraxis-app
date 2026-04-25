import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  CreateWalletEntryCommand,
  UpdateWalletEntryCommand,
  WalletCollection,
  WalletEntry,
  WalletListQuery,
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

export const createWalletService = (client: AxiosInstance) => {
  return {
    listEntries: async (
      query: WalletListQuery = {},
    ): Promise<WalletCollection> => {
      const response = await client.get(apiContractMap.walletSummary.path, {
        params: {
          page: query.page,
          per_page: query.perPage,
        },
      });
      return mapWalletPayload(unwrapEnvelopeData<WalletPayload>(response.data));
    },
    createEntry: async (
      command: CreateWalletEntryCommand,
    ): Promise<WalletEntry> => {
      const response = await client.post(
        apiContractMap.walletCreate.path,
        buildCreatePayload(command),
      );
      const payload = unwrapEnvelopeData<{ readonly entry: WalletEntryPayload }>(
        response.data,
      );
      return mapEntry(payload.entry);
    },
    updateEntry: async (
      command: UpdateWalletEntryCommand,
    ): Promise<WalletEntry> => {
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
  };
};

export const walletService = createWalletService(httpClient);
