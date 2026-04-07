import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  WalletCollection,
  WalletListQuery,
} from "@/features/wallet/contracts";

interface WalletPayload {
  readonly items: {
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
  }[];
  readonly total: number;
  readonly returned_items: number;
  readonly limit: number;
  readonly has_more: boolean;
}

const mapWalletPayload = (payload: WalletPayload): WalletCollection => {
  return {
    items: payload.items.map((item) => ({
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
    })),
    total: payload.total,
    returnedItems: payload.returned_items,
    limit: payload.limit,
    hasMore: payload.has_more,
  };
};

export const createWalletService = (client: AxiosInstance) => {
  return {
    listEntries: async (
      query: WalletListQuery = {},
    ): Promise<WalletCollection> => {
      const response = await client.get("/wallet", {
        params: {
          page: query.page,
          per_page: query.perPage,
        },
      });

      return mapWalletPayload(unwrapEnvelopeData<WalletPayload>(response.data));
    },
  };
};

export const walletService = createWalletService(httpClient);
