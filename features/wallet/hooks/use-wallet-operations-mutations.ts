import { useQueryClient } from "@tanstack/react-query";

import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateWalletOperationCommand,
  DeleteWalletOperationCommand,
  WalletOperation,
} from "@/features/wallet/contracts";
import { walletService } from "@/features/wallet/services/wallet-service";

const useInvalidateWallet = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.root });
  };
};

export const useCreateWalletOperationMutation = () => {
  const invalidate = useInvalidateWallet();
  return createApiMutation<WalletOperation, CreateWalletOperationCommand>(
    (command) => walletService.createOperation(command),
    { onSuccess: invalidate },
  );
};

export const useDeleteWalletOperationMutation = () => {
  const invalidate = useInvalidateWallet();
  return createApiMutation<void, DeleteWalletOperationCommand>(
    (command) => walletService.deleteOperation(command),
    { onSuccess: invalidate },
  );
};
