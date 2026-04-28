import { useMemo, useState } from "react";

import type { BrapiCurrentQuote } from "@/features/wallet/brapi-contracts";
import type { WalletEntry } from "@/features/wallet/contracts";
import {
  useCreateWalletEntryMutation,
  useDeleteWalletEntryMutation,
  useUpdateWalletEntryMutation,
} from "@/features/wallet/hooks/use-wallet-mutations";
import { useWalletEntriesQuery } from "@/features/wallet/hooks/use-wallet-query";
import {
  useWalletLiveQuotes,
  type WalletLiveQuotes,
} from "@/features/wallet/hooks/use-wallet-live-quotes";
import type { CreateWalletEntryFormValues } from "@/features/wallet/validators";

export type WalletFormMode =
  | { readonly kind: "closed" }
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly entry: WalletEntry };

export interface WalletAssetSummary {
  readonly id: string;
  readonly name: string;
  readonly ticker: string | null;
  readonly amount: number;
  readonly liveAmount: number | null;
  readonly liveChangePercent: number | null;
  readonly allocation: number;
  readonly isQuoteLoading: boolean;
  readonly hasQuoteError: boolean;
}

export interface WalletScreenController {
  readonly walletQuery: ReturnType<typeof useWalletEntriesQuery>;
  readonly total: number;
  readonly liveTotal: number | null;
  readonly assets: readonly WalletAssetSummary[];
  readonly entries: readonly WalletEntry[];
  readonly formMode: WalletFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingEntryId: string | null;
  readonly liveQuotes: WalletLiveQuotes;
  readonly isRefreshingQuotes: boolean;
  readonly handleOpenCreate: () => void;
  readonly handleOpenEdit: (entry: WalletEntry) => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateWalletEntryFormValues) => Promise<void>;
  readonly handleDelete: (entryId: string) => Promise<void>;
  readonly handleRefreshQuotes: () => Promise<void>;
  readonly dismissSubmitError: () => void;
}

const toAllocationPercentage = (amount: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }
  return Number(((amount / total) * 100).toFixed(2));
};

interface ProjectAssetParams {
  readonly entry: WalletEntry;
  readonly liveQuotes: WalletLiveQuotes;
  readonly denominator: number;
}

const computeLiveAmount = (
  quote: BrapiCurrentQuote | null,
  quantity: number | null,
): number | null => {
  if (!quote || typeof quantity !== "number" || quantity <= 0) {
    return null;
  }
  return quote.price * quantity;
};

const projectAssetSummary = ({
  entry,
  liveQuotes,
  denominator,
}: ProjectAssetParams): WalletAssetSummary => {
  const amount = entry.value ?? 0;
  const tickerKey = entry.ticker?.trim().toUpperCase() ?? "";
  const quoteEntry =
    tickerKey.length > 0 ? liveQuotes.byTicker.get(tickerKey) : undefined;
  const quote = quoteEntry?.quote ?? null;
  const liveAmount = computeLiveAmount(quote, entry.quantity);
  return {
    id: entry.id,
    name: entry.name,
    ticker: entry.ticker,
    amount,
    liveAmount,
    liveChangePercent: quote?.changePercent ?? null,
    allocation: toAllocationPercentage(liveAmount ?? amount, denominator),
    isQuoteLoading: Boolean(quoteEntry?.isLoading),
    hasQuoteError: Boolean(quoteEntry?.isError),
  };
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

  const liveQuotes = useWalletLiveQuotes(entries);

  const assets = useMemo<readonly WalletAssetSummary[]>(() => {
    const baseTotal = walletQuery.data?.total ?? 0;
    const denominator = liveQuotes.liveTotal ?? baseTotal;
    return entries.map((entry) =>
      projectAssetSummary({ entry, liveQuotes, denominator }),
    );
  }, [entries, liveQuotes, walletQuery.data]);

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
    liveTotal: liveQuotes.liveTotal,
    assets,
    entries,
    formMode,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
    deletingEntryId,
    liveQuotes,
    isRefreshingQuotes: liveQuotes.isFetching,
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
    handleRefreshQuotes: async () => {
      await Promise.all([walletQuery.refetch(), liveQuotes.refetch()]);
    },
    dismissSubmitError: () => {
      setSubmitError(null);
      createMutation.reset();
      updateMutation.reset();
    },
  };
}
