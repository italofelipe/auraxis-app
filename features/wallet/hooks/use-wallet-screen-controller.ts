import { useMemo, useState } from "react";

import type { WalletEntry } from "@/features/wallet/contracts";
import {
  useCreateWalletEntryMutation,
  useDeleteWalletEntryMutation,
  useUpdateWalletEntryMutation,
} from "@/features/wallet/hooks/use-wallet-mutations";
import { useWalletEntriesQuery } from "@/features/wallet/hooks/use-wallet-query";
import type { CreateWalletEntryFormValues } from "@/features/wallet/validators";

export type WalletFormMode =
  | { readonly kind: "closed" }
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly entry: WalletEntry };

export interface WalletAssetSummary {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly allocation: number;
}

export interface WalletScreenController {
  readonly walletQuery: ReturnType<typeof useWalletEntriesQuery>;
  readonly total: number;
  readonly assets: readonly WalletAssetSummary[];
  readonly entries: readonly WalletEntry[];
  readonly formMode: WalletFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingEntryId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleOpenEdit: (entry: WalletEntry) => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateWalletEntryFormValues) => Promise<void>;
  readonly handleDelete: (entryId: string) => Promise<void>;
  readonly dismissSubmitError: () => void;
}

const toAllocationPercentage = (amount: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }
  return Number(((amount / total) * 100).toFixed(2));
};

interface SubmitHandlerDeps {
  readonly formMode: WalletFormMode;
  readonly createMutation: ReturnType<typeof useCreateWalletEntryMutation>;
  readonly updateMutation: ReturnType<typeof useUpdateWalletEntryMutation>;
  readonly setFormMode: (mode: WalletFormMode) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildSubmitHandler = ({
  formMode,
  createMutation,
  updateMutation,
  setFormMode,
  setSubmitError,
}: SubmitHandlerDeps) => {
  return async (values: CreateWalletEntryFormValues): Promise<void> => {
    setSubmitError(null);
    try {
      if (formMode.kind === "edit") {
        await updateMutation.mutateAsync({ entryId: formMode.entry.id, ...values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormMode({ kind: "closed" });
    } catch (error) {
      setSubmitError(error);
    }
  };
};

interface DeleteHandlerDeps {
  readonly deleteMutation: ReturnType<typeof useDeleteWalletEntryMutation>;
  readonly setDeletingEntryId: (id: string | null) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildDeleteHandler = ({
  deleteMutation,
  setDeletingEntryId,
  setSubmitError,
}: DeleteHandlerDeps) => {
  return async (entryId: string): Promise<void> => {
    setDeletingEntryId(entryId);
    try {
      await deleteMutation.mutateAsync(entryId);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingEntryId(null);
    }
  };
};

/**
 * Canonical controller for the wallet screen. Owns the create/edit form
 * state machine, the per-entry delete tracker, the three mutations and
 * the asset summary projection.
 */
export function useWalletScreenController(): WalletScreenController {
  const walletQuery = useWalletEntriesQuery();
  const createMutation = useCreateWalletEntryMutation();
  const updateMutation = useUpdateWalletEntryMutation();
  const deleteMutation = useDeleteWalletEntryMutation();
  const [formMode, setFormMode] = useState<WalletFormMode>({ kind: "closed" });
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const entries = useMemo<readonly WalletEntry[]>(
    () => walletQuery.data?.items ?? [],
    [walletQuery.data],
  );

  const assets = useMemo<readonly WalletAssetSummary[]>(() => {
    const total = walletQuery.data?.total ?? 0;
    return entries.map((item) => {
      const amount = item.value ?? 0;
      return {
        id: item.id,
        name: item.name,
        amount,
        allocation: toAllocationPercentage(amount, total),
      };
    });
  }, [entries, walletQuery.data]);

  const handleSubmit = buildSubmitHandler({
    formMode,
    createMutation,
    updateMutation,
    setFormMode,
    setSubmitError,
  });

  const handleDelete = buildDeleteHandler({
    deleteMutation,
    setDeletingEntryId,
    setSubmitError,
  });

  return {
    walletQuery,
    total: walletQuery.data?.total ?? 0,
    assets,
    entries,
    formMode,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
    deletingEntryId,
    handleOpenCreate: () => {
      setSubmitError(null);
      setFormMode({ kind: "create" });
    },
    handleOpenEdit: (entry) => {
      setSubmitError(null);
      setFormMode({ kind: "edit", entry });
    },
    handleCloseForm: () => {
      setSubmitError(null);
      setFormMode({ kind: "closed" });
    },
    handleSubmit,
    handleDelete,
    dismissSubmitError: () => {
      setSubmitError(null);
      createMutation.reset();
      updateMutation.reset();
    },
  };
}
