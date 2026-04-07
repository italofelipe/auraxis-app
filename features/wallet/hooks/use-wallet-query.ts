import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  WalletCollection,
  WalletListQuery,
} from "@/features/wallet/contracts";
import { walletService } from "@/features/wallet/services/wallet-service";

export const useWalletEntriesQuery = (query: WalletListQuery = {}) => {
  return createApiQuery<WalletCollection>(
    [...queryKeys.wallet.root, "entries", query],
    () => walletService.listEntries(query),
  );
};
