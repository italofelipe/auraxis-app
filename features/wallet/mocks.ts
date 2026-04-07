import type { WalletCollection } from "@/features/wallet/contracts";

export const walletCollectionFixture: WalletCollection = {
  items: [
    {
      id: "wallet-1",
      name: "Tesouro Selic",
      value: 45800,
      estimatedValueOnCreateDate: 43000,
      ticker: null,
      quantity: 1,
      assetClass: "fixed_income",
      annualRate: 11.2,
      targetWithdrawDate: null,
      registerDate: "2025-01-10",
      shouldBeOnWallet: true,
    },
    {
      id: "wallet-2",
      name: "Reserva CDI",
      value: 21000,
      estimatedValueOnCreateDate: 20000,
      ticker: null,
      quantity: 1,
      assetClass: "cash",
      annualRate: 10.8,
      targetWithdrawDate: null,
      registerDate: "2024-11-01",
      shouldBeOnWallet: true,
    },
  ],
  total: 2,
  returnedItems: 2,
  limit: 10,
  hasMore: false,
};
