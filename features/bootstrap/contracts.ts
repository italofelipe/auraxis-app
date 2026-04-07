export interface BootstrapIdentity {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface BootstrapProfile {
  readonly gender: string | null;
  readonly birthDate: string | null;
  readonly stateUf: string | null;
  readonly occupation: string | null;
}

export interface BootstrapFinancialProfile {
  readonly monthlyIncomeNet: number | null;
  readonly monthlyExpenses: number | null;
  readonly netWorth: number | null;
  readonly initialInvestment: number | null;
  readonly monthlyInvestment: number | null;
  readonly investmentGoalDate: string | null;
}

export interface BootstrapInvestorProfile {
  readonly declared: string | null;
  readonly suggested: string | null;
  readonly quizScore: number | null;
  readonly taxonomyVersion: string | null;
  readonly financialObjectives: string | null;
}

export interface BootstrapProductContext {
  readonly entitlementsVersion: number;
}

export interface BootstrapUser {
  readonly identity: BootstrapIdentity;
  readonly profile: BootstrapProfile;
  readonly financialProfile: BootstrapFinancialProfile;
  readonly investorProfile: BootstrapInvestorProfile;
  readonly productContext: BootstrapProductContext;
}

export interface BootstrapTransactionPreviewItem {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: string;
  readonly status: string;
}

export interface BootstrapWalletPreviewItem {
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

export interface BootstrapTransactionsPreview {
  readonly items: BootstrapTransactionPreviewItem[];
  readonly returnedItems: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

export interface BootstrapWalletPreview {
  readonly items: BootstrapWalletPreviewItem[];
  readonly total: number;
  readonly returnedItems: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

export interface UserBootstrap {
  readonly user: BootstrapUser;
  readonly transactionsPreview: BootstrapTransactionsPreview;
  readonly wallet: BootstrapWalletPreview;
}

export interface UserBootstrapQuery {
  readonly transactionsLimit?: number;
}
