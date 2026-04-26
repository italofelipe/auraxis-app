import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { AccountListResponse } from "@/features/accounts/contracts";
import { accountsService } from "@/features/accounts/services/accounts-service";

export const useAccountsQuery = () => {
  return createApiQuery<AccountListResponse>(queryKeys.accounts.list(), () =>
    accountsService.listAccounts(),
  );
};
