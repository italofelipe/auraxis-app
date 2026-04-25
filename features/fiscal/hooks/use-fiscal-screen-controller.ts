import { useState } from "react";

import {
  useCreateReceivableMutation,
  useDeleteReceivableMutation,
  useMarkReceivableReceivedMutation,
} from "@/features/fiscal/hooks/use-fiscal-mutations";
import {
  useReceivablesQuery,
  useRevenueSummaryQuery,
} from "@/features/fiscal/hooks/use-fiscal-query";
import {
  normalizeAmount,
  type CreateReceivableFormValues,
} from "@/features/fiscal/validators";

export type FiscalFormMode = "closed" | "create";

export interface FiscalScreenController {
  readonly receivablesQuery: ReturnType<typeof useReceivablesQuery>;
  readonly summaryQuery: ReturnType<typeof useRevenueSummaryQuery>;
  readonly formMode: FiscalFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly markingReceivableId: string | null;
  readonly deletingReceivableId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateReceivableFormValues) => Promise<void>;
  readonly handleMarkReceived: (receivableId: string) => Promise<void>;
  readonly handleDelete: (receivableId: string) => Promise<void>;
  readonly dismissSubmitError: () => void;
}

const today = (): string => new Date().toISOString().slice(0, 10);

/**
 * Canonical controller for the fiscal receivables screen. Owns the create
 * form, the per-receivable mark-received and delete trackers, and the
 * three mutations.
 */
export function useFiscalScreenController(): FiscalScreenController {
  const receivablesQuery = useReceivablesQuery();
  const summaryQuery = useRevenueSummaryQuery();
  const createMutation = useCreateReceivableMutation();
  const markReceivedMutation = useMarkReceivableReceivedMutation();
  const deleteMutation = useDeleteReceivableMutation();
  const [formMode, setFormMode] = useState<FiscalFormMode>("closed");
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [markingReceivableId, setMarkingReceivableId] = useState<string | null>(null);
  const [deletingReceivableId, setDeletingReceivableId] = useState<string | null>(null);

  const handleSubmit = async (
    values: CreateReceivableFormValues,
  ): Promise<void> => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        description: values.description,
        amount: normalizeAmount(values.amount),
        expectedDate: values.expectedDate,
        category: values.category,
      });
      setFormMode("closed");
    } catch (error) {
      setSubmitError(error);
    }
  };

  const handleMarkReceived = async (receivableId: string): Promise<void> => {
    setMarkingReceivableId(receivableId);
    try {
      await markReceivedMutation.mutateAsync({
        receivableId,
        payload: { receivedDate: today() },
      });
    } catch (error) {
      setSubmitError(error);
    } finally {
      setMarkingReceivableId(null);
    }
  };

  const handleDelete = async (receivableId: string): Promise<void> => {
    setDeletingReceivableId(receivableId);
    try {
      await deleteMutation.mutateAsync(receivableId);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingReceivableId(null);
    }
  };

  return {
    receivablesQuery,
    summaryQuery,
    formMode,
    isSubmitting: createMutation.isPending,
    submitError,
    markingReceivableId,
    deletingReceivableId,
    handleOpenCreate: () => {
      setSubmitError(null);
      setFormMode("create");
    },
    handleCloseForm: () => {
      setSubmitError(null);
      setFormMode("closed");
    },
    handleSubmit,
    handleMarkReceived,
    handleDelete,
    dismissSubmitError: () => {
      setSubmitError(null);
      createMutation.reset();
    },
  };
}
