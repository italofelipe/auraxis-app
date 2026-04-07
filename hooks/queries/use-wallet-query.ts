import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { walletService } from "@/features/wallet/services/wallet-service";
import type { WalletSummary } from "@/types/contracts";

const toAllocationPercentage = (amount: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }

  return Number(((amount / total) * 100).toFixed(2));
};

export const useWalletSummaryQuery = () => {
  return useQuery<WalletSummary>({
    queryKey: queryKeys.wallet.summary(),
    queryFn: async (): Promise<WalletSummary> => {
      const collection = await walletService.listEntries();

      return {
        total: collection.total,
        assets: collection.items.map((item) => {
          const amount = item.value ?? 0;

          return {
            id: item.id,
            name: item.name,
            amount,
            allocation: toAllocationPercentage(amount, collection.total),
          };
        }),
      };
    },
  });
};
