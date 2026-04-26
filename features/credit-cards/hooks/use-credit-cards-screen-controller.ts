import { useState } from "react";

import type { CreditCard } from "@/features/credit-cards/contracts";
import {
  useCreateCreditCardMutation,
  useDeleteCreditCardMutation,
  useUpdateCreditCardMutation,
} from "@/features/credit-cards/hooks/use-credit-cards-mutations";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import type { CreateCreditCardFormValues } from "@/features/credit-cards/validators";

export type CreditCardFormMode =
  | { readonly kind: "closed" }
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly creditCard: CreditCard };

export interface CreditCardsScreenController {
  readonly creditCardsQuery: ReturnType<typeof useCreditCardsQuery>;
  readonly creditCards: readonly CreditCard[];
  readonly formMode: CreditCardFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingCreditCardId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleOpenEdit: (creditCard: CreditCard) => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateCreditCardFormValues) => Promise<void>;
  readonly handleDelete: (creditCardId: string) => Promise<void>;
  readonly dismissSubmitError: () => void;
}

interface SubmitDeps {
  readonly formMode: CreditCardFormMode;
  readonly createMutation: ReturnType<typeof useCreateCreditCardMutation>;
  readonly updateMutation: ReturnType<typeof useUpdateCreditCardMutation>;
  readonly setFormMode: (mode: CreditCardFormMode) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildSubmitHandler = ({
  formMode,
  createMutation,
  updateMutation,
  setFormMode,
  setSubmitError,
}: SubmitDeps) => {
  return async (values: CreateCreditCardFormValues): Promise<void> => {
    setSubmitError(null);
    try {
      if (formMode.kind === "edit") {
        await updateMutation.mutateAsync({
          creditCardId: formMode.creditCard.id,
          ...values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormMode({ kind: "closed" });
    } catch (error) {
      setSubmitError(error);
    }
  };
};

interface DeleteDeps {
  readonly deleteMutation: ReturnType<typeof useDeleteCreditCardMutation>;
  readonly setDeletingCreditCardId: (id: string | null) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildDeleteHandler = ({
  deleteMutation,
  setDeletingCreditCardId,
  setSubmitError,
}: DeleteDeps) => {
  return async (creditCardId: string): Promise<void> => {
    setDeletingCreditCardId(creditCardId);
    try {
      await deleteMutation.mutateAsync(creditCardId);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingCreditCardId(null);
    }
  };
};

export function useCreditCardsScreenController(): CreditCardsScreenController {
  const creditCardsQuery = useCreditCardsQuery();
  const createMutation = useCreateCreditCardMutation();
  const updateMutation = useUpdateCreditCardMutation();
  const deleteMutation = useDeleteCreditCardMutation();
  const [formMode, setFormMode] = useState<CreditCardFormMode>({ kind: "closed" });
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [deletingCreditCardId, setDeletingCreditCardId] = useState<string | null>(
    null,
  );

  const handleSubmit = buildSubmitHandler({
    formMode,
    createMutation,
    updateMutation,
    setFormMode,
    setSubmitError,
  });

  const handleDelete = buildDeleteHandler({
    deleteMutation,
    setDeletingCreditCardId,
    setSubmitError,
  });

  return {
    creditCardsQuery,
    creditCards: creditCardsQuery.data?.creditCards ?? [],
    formMode,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
    deletingCreditCardId,
    handleOpenCreate: () => {
      setSubmitError(null);
      setFormMode({ kind: "create" });
    },
    handleOpenEdit: (creditCard) => {
      setSubmitError(null);
      setFormMode({ kind: "edit", creditCard });
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
