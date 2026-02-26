import { useQuery } from "@tanstack/react-query";

import { walletApi, walletPlaceholder } from "@/lib/wallet-api";
import type { WalletSummary } from "@/types/contracts";

export const useWalletSummaryQuery = () => {
  return useQuery<WalletSummary>({
    queryKey: ["wallet", "summary"],
    queryFn: async (): Promise<WalletSummary> => {
      try {
        return await walletApi.getSummary();
      } catch {
        return walletPlaceholder;
      }
    },
  });
};
