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

export type WalletOperationKind = "buy" | "sell";

export interface WalletOperation {
  readonly id: string;
  readonly kind: WalletOperationKind;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalValue: number;
  readonly executedAt: string;
  readonly notes: string | null;
}

export interface WalletOperationsListResponse {
  readonly operations: WalletOperation[];
  readonly count: number;
}

export interface WalletOperationsPosition {
  readonly entryId: string;
  readonly currentQuantity: number;
  readonly averagePrice: number;
  readonly investedAmount: number;
  readonly realizedProfit: number;
}

export interface CreateWalletOperationCommand {
  readonly entryId: string;
  readonly kind: WalletOperationKind;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly executedAt: string;
  readonly notes?: string | null;
}

export interface DeleteWalletOperationCommand {
  readonly entryId: string;
  readonly operationId: string;
}

export interface WalletValuationSummary {
  readonly totalCurrentValue: number;
  readonly totalInvestedAmount: number;
  readonly totalProfitLossPercent: number;
  readonly totalInvestments: number;
}

export interface WalletValuationHistoryPoint {
  readonly date: string;
  readonly totalValue: number;
  readonly investedAmount: number;
  readonly profitLossPercent: number;
}

export interface WalletValuationHistoryResponse {
  readonly history: readonly WalletValuationHistoryPoint[];
}

export interface WalletValuationHistoryQuery {
  readonly startDate?: string | null;
  readonly endDate?: string | null;
}
