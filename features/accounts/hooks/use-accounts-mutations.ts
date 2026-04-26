import { useQueryClient } from "@tanstack/react-query";

import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  Account,
  CreateAccountCommand,
  UpdateAccountCommand,
} from "@/features/accounts/contracts";
import { accountsService } from "@/features/accounts/services/accounts-service";

const useInvalidateAccounts = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.accounts.root });
  };
};

export const useCreateAccountMutation = () => {
  const invalidate = useInvalidateAccounts();
  return createApiMutation<Account, CreateAccountCommand>(
    (command) => accountsService.createAccount(command),
    { onSuccess: invalidate },
  );
};

export const useUpdateAccountMutation = () => {
  const invalidate = useInvalidateAccounts();
  return createApiMutation<Account, UpdateAccountCommand>(
    (command) => accountsService.updateAccount(command),
    { onSuccess: invalidate },
  );
};

export const useDeleteAccountMutation = () => {
  const invalidate = useInvalidateAccounts();
  return createApiMutation<void, string>(
    (accountId) => accountsService.deleteAccount(accountId),
    { onSuccess: invalidate },
  );
};
