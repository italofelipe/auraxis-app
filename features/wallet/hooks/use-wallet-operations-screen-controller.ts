import { useRouter } from "expo-router";
import { useState } from "react";

import { appRoutes } from "@/core/navigation/routes";
import type {
  WalletOperation,
  WalletOperationsPosition,
} from "@/features/wallet/contracts";
import {
  useCreateWalletOperationMutation,
  useDeleteWalletOperationMutation,
} from "@/features/wallet/hooks/use-wallet-operations-mutations";
import {
  useWalletOperationsPositionQuery,
  useWalletOperationsQuery,
} from "@/features/wallet/hooks/use-wallet-operations-query";
import type { CreateWalletOperationFormValues } from "@/features/wallet/validators-operations";

export type WalletOperationsFormMode = "closed" | "create";

export interface WalletOperationsScreenController {
  readonly entryId: string;
  readonly operationsQuery: ReturnType<typeof useWalletOperationsQuery>;
  readonly positionQuery: ReturnType<typeof useWalletOperationsPositionQuery>;
  readonly operations: readonly WalletOperation[];
  readonly position: WalletOperationsPosition | null;
  readonly formMode: WalletOperationsFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingOperationId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateWalletOperationFormValues) => Promise<void>;
  readonly handleDelete: (operationId: string) => Promise<void>;
  readonly dismissSubmitError: () => void;
  readonly handleBackToWallet: () => void;
}

/**
 * Canonical controller for the wallet operations screen.
 */
export function useWalletOperationsScreenController(
  entryId: string,
): WalletOperationsScreenController {
  const router = useRouter();
  const operationsQuery = useWalletOperationsQuery(entryId);
  const positionQuery = useWalletOperationsPositionQuery(entryId);
  const createMutation = useCreateWalletOperationMutation();
  const deleteMutation = useDeleteWalletOperationMutation();
  const [formMode, setFormMode] = useState<WalletOperationsFormMode>("closed");
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [deletingOperationId, setDeletingOperationId] = useState<string | null>(null);

  const handleSubmit = async (
    values: CreateWalletOperationFormValues,
  ): Promise<void> => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        entryId,
        kind: values.kind,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        executedAt: values.executedAt,
        notes: values.notes ?? null,
      });
      setFormMode("closed");
    } catch (error) {
      setSubmitError(error);
    }
  };

  const handleDelete = async (operationId: string): Promise<void> => {
    setDeletingOperationId(operationId);
    try {
      await deleteMutation.mutateAsync({ entryId, operationId });
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingOperationId(null);
    }
  };

  return {
    entryId,
    operationsQuery,
    positionQuery,
    operations: operationsQuery.data?.operations ?? [],
    position: positionQuery.data ?? null,
    formMode,
    isSubmitting: createMutation.isPending,
    submitError,
    deletingOperationId,
    handleOpenCreate: () => {
      setSubmitError(null);
      setFormMode("create");
    },
    handleCloseForm: () => {
      setSubmitError(null);
      setFormMode("closed");
    },
    handleSubmit,
    handleDelete,
    dismissSubmitError: () => {
      setSubmitError(null);
      createMutation.reset();
    },
    handleBackToWallet: () => {
      router.replace(appRoutes.private.wallet);
    },
  };
}
