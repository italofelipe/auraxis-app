import { createApiQuery } from "@/core/query/create-api-query";
import type {
  WalletCollection,
  WalletListQuery,
} from "@/features/wallet/contracts";
import { walletService } from "@/features/wallet/services/wallet-service";

export const useWalletEntriesQuery = (query: WalletListQuery = {}) => {
  return createApiQuery<WalletCollection>(
    ["wallet", "entries", query],
    () => walletService.listEntries(query),
  );
};
