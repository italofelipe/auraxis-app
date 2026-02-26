import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
import type { WalletSummary } from "@/types/contracts";

interface WalletApiClient {
  readonly get: AxiosInstance["get"];
}

export const walletPlaceholder: WalletSummary = {
  total: 65300,
  assets: [
    { id: "reserve", name: "Reserva", amount: 31000, allocation: 47.47 },
    { id: "equities", name: "Acoes", amount: 22300, allocation: 34.15 },
    { id: "crypto", name: "Cripto", amount: 12000, allocation: 18.38 },
  ],
};

export const createWalletApi = (client: WalletApiClient) => {
  return {
    getSummary: async (): Promise<WalletSummary> => {
      const response = await client.get<WalletSummary>("/wallet/summary");
      return response.data;
    },
  };
};

export const walletApi = createWalletApi(httpClient);
