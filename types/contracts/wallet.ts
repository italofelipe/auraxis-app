export interface WalletAsset {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly allocation: number;
}

export interface WalletSummary {
  readonly total: number;
  readonly assets: WalletAsset[];
}
