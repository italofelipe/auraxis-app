export interface WalletEntry {
  readonly id: string;
  readonly name: string;
  readonly value: number | null;
  readonly estimatedValueOnCreateDate: number | null;
  readonly ticker: string | null;
  readonly quantity: number | null;
  readonly assetClass: string;
  readonly annualRate: number | null;
  readonly targetWithdrawDate: string | null;
  readonly registerDate: string;
  readonly shouldBeOnWallet: boolean;
}

export interface WalletCollection {
  readonly items: WalletEntry[];
  readonly total: number;
  readonly returnedItems: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

export interface WalletListQuery {
  readonly page?: number;
  readonly perPage?: number;
}

export type WalletSummary = WalletCollection;

export interface CreateWalletEntryCommand {
  readonly name: string;
  readonly assetClass: string;
  readonly value?: number | null;
  readonly ticker?: string | null;
  readonly quantity?: number | null;
  readonly annualRate?: number | null;
  readonly targetWithdrawDate?: string | null;
  readonly registerDate?: string | null;
}

export interface UpdateWalletEntryCommand {
  readonly entryId: string;
  readonly name?: string;
  readonly assetClass?: string;
  readonly value?: number | null;
  readonly ticker?: string | null;
  readonly quantity?: number | null;
  readonly annualRate?: number | null;
  readonly targetWithdrawDate?: string | null;
  readonly shouldBeOnWallet?: boolean;
}
