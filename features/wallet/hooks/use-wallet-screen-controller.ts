import { useMemo } from "react";

import { useWalletEntriesQuery } from "@/features/wallet/hooks/use-wallet-query";

export interface WalletAssetSummary {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly allocation: number;
}

export interface WalletScreenController {
  readonly walletQuery: ReturnType<typeof useWalletEntriesQuery>;
  readonly total: number;
  readonly assets: WalletAssetSummary[];
}

const toAllocationPercentage = (amount: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }

  return Number(((amount / total) * 100).toFixed(2));
};

/**
 * Creates the canonical controller for the wallet screen.
 *
 * @returns Normalized wallet summary for view-only rendering.
 */
export function useWalletScreenController(): WalletScreenController {
  const walletQuery = useWalletEntriesQuery();

  const assets = useMemo<WalletAssetSummary[]>(() => {
    const total = walletQuery.data?.total ?? 0;

    return walletQuery.data?.items.map((item) => {
      const amount = item.value ?? 0;

      return {
        id: item.id,
        name: item.name,
        amount,
        allocation: toAllocationPercentage(amount, total),
      };
    }) ?? [];
  }, [walletQuery.data]);

  return {
    walletQuery,
    total: walletQuery.data?.total ?? 0,
    assets,
  };
}
