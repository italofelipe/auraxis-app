import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  Account,
  AccountListResponse,
  AccountType,
  CreateAccountCommand,
  UpdateAccountCommand,
} from "@/features/accounts/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface AccountPayload {
  readonly id: string;
  readonly name: string;
  readonly account_type: AccountType;
  readonly institution: string | null;
  readonly initial_balance: number;
}

const mapAccount = (payload: AccountPayload): Account => ({
  id: payload.id,
  name: payload.name,
  accountType: payload.account_type,
  institution: payload.institution,
  initialBalance: payload.initial_balance,
});

const buildPayload = (
  command: CreateAccountCommand | Omit<UpdateAccountCommand, "accountId">,
) => ({
  name: command.name,
  account_type: command.accountType,
  institution: command.institution ?? null,
  initial_balance: command.initialBalance ?? 0,
});

export const createAccountsService = (client: AxiosInstance) => ({
  listAccounts: async (): Promise<AccountListResponse> => {
    const response = await client.get(apiContractMap.accountsList.path);
    const payload = unwrapEnvelopeData<{ readonly accounts: AccountPayload[] }>(
      response.data,
    );
    return { accounts: payload.accounts.map(mapAccount) };
  },
  createAccount: async (command: CreateAccountCommand): Promise<Account> => {
    const response = await client.post(
      apiContractMap.accountsCreate.path,
      buildPayload(command),
    );
    const payload = unwrapEnvelopeData<{ readonly account: AccountPayload }>(
      response.data,
    );
    return mapAccount(payload.account);
  },
  updateAccount: async (command: UpdateAccountCommand): Promise<Account> => {
    const { accountId, ...rest } = command;
    const response = await client.put(
      resolveApiContractPath(apiContractMap.accountUpdate.path, {
        account_id: accountId,
      }),
      buildPayload(rest),
    );
    const payload = unwrapEnvelopeData<{ readonly account: AccountPayload }>(
      response.data,
    );
    return mapAccount(payload.account);
  },
  deleteAccount: async (accountId: string): Promise<void> => {
    await client.delete(
      resolveApiContractPath(apiContractMap.accountDelete.path, {
        account_id: accountId,
      }),
    );
  },
});

export const accountsService = createAccountsService(httpClient);
