export type AccountType = "checking" | "savings" | "investment" | "wallet" | "other";

export interface Account {
  readonly id: string;
  readonly name: string;
  readonly accountType: AccountType;
  readonly institution: string | null;
  readonly initialBalance: number;
}

export interface AccountListResponse {
  readonly accounts: readonly Account[];
}

export interface CreateAccountCommand {
  readonly name: string;
  readonly accountType: AccountType;
  readonly institution?: string | null;
  readonly initialBalance?: number;
}

export interface UpdateAccountCommand {
  readonly accountId: string;
  readonly name: string;
  readonly accountType: AccountType;
  readonly institution?: string | null;
  readonly initialBalance?: number;
}
