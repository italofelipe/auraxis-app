import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  WalletOperationsListResponse,
  WalletOperationsPosition,
} from "@/features/wallet/contracts";
import { walletService } from "@/features/wallet/services/wallet-service";

export const useWalletOperationsQuery = (entryId: string | null) => {
  return createApiQuery<WalletOperationsListResponse>(
    queryKeys.wallet.operations(entryId ?? "__disabled__"),
    () => walletService.listOperations(entryId as string),
    { enabled: !!entryId },
  );
};

export const useWalletOperationsPositionQuery = (entryId: string | null) => {
  return createApiQuery<WalletOperationsPosition>(
    queryKeys.wallet.position(entryId ?? "__disabled__"),
    () => walletService.getOperationsPosition(entryId as string),
    { enabled: !!entryId },
  );
};
