import { useQueryClient } from "@tanstack/react-query";

import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateWalletEntryCommand,
  UpdateWalletEntryCommand,
  WalletEntry,
} from "@/features/wallet/contracts";
import { walletService } from "@/features/wallet/services/wallet-service";

const useInvalidateWallet = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.root });
  };
};

export const useCreateWalletEntryMutation = () => {
  const invalidate = useInvalidateWallet();
  return createApiMutation<WalletEntry, CreateWalletEntryCommand>(
    (command) => walletService.createEntry(command),
    { onSuccess: invalidate },
  );
};

export const useUpdateWalletEntryMutation = () => {
  const invalidate = useInvalidateWallet();
  return createApiMutation<WalletEntry, UpdateWalletEntryCommand>(
    (command) => walletService.updateEntry(command),
    { onSuccess: invalidate },
  );
};

export const useDeleteWalletEntryMutation = () => {
  const invalidate = useInvalidateWallet();
  return createApiMutation<void, string>(
    (entryId) => walletService.deleteEntry(entryId),
    { onSuccess: invalidate },
  );
};
