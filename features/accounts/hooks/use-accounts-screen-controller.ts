import { useState } from "react";

import type { Account } from "@/features/accounts/contracts";
import {
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useUpdateAccountMutation,
} from "@/features/accounts/hooks/use-accounts-mutations";
import { useAccountsQuery } from "@/features/accounts/hooks/use-accounts-query";
import type { CreateAccountFormValues } from "@/features/accounts/validators";

export type AccountFormMode =
  | { readonly kind: "closed" }
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly account: Account };

export interface AccountsScreenController {
  readonly accountsQuery: ReturnType<typeof useAccountsQuery>;
  readonly accounts: readonly Account[];
  readonly formMode: AccountFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingAccountId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleOpenEdit: (account: Account) => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateAccountFormValues) => Promise<void>;
  readonly handleDelete: (accountId: string) => Promise<void>;
  readonly dismissSubmitError: () => void;
}

interface SubmitDeps {
  readonly formMode: AccountFormMode;
  readonly createMutation: ReturnType<typeof useCreateAccountMutation>;
  readonly updateMutation: ReturnType<typeof useUpdateAccountMutation>;
  readonly setFormMode: (mode: AccountFormMode) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildSubmitHandler = ({
  formMode,
  createMutation,
  updateMutation,
  setFormMode,
  setSubmitError,
}: SubmitDeps) => {
  return async (values: CreateAccountFormValues): Promise<void> => {
    setSubmitError(null);
    try {
      if (formMode.kind === "edit") {
        await updateMutation.mutateAsync({
          accountId: formMode.account.id,
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
  readonly deleteMutation: ReturnType<typeof useDeleteAccountMutation>;
  readonly setDeletingAccountId: (id: string | null) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildDeleteHandler = ({
  deleteMutation,
  setDeletingAccountId,
  setSubmitError,
}: DeleteDeps) => {
  return async (accountId: string): Promise<void> => {
    setDeletingAccountId(accountId);
    try {
      await deleteMutation.mutateAsync(accountId);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingAccountId(null);
    }
  };
};

export function useAccountsScreenController(): AccountsScreenController {
  const accountsQuery = useAccountsQuery();
  const createMutation = useCreateAccountMutation();
  const updateMutation = useUpdateAccountMutation();
  const deleteMutation = useDeleteAccountMutation();
  const [formMode, setFormMode] = useState<AccountFormMode>({ kind: "closed" });
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const handleSubmit = buildSubmitHandler({
    formMode,
    createMutation,
    updateMutation,
    setFormMode,
    setSubmitError,
  });

  const handleDelete = buildDeleteHandler({
    deleteMutation,
    setDeletingAccountId,
    setSubmitError,
  });

  return {
    accountsQuery,
    accounts: accountsQuery.data?.accounts ?? [],
    formMode,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
    deletingAccountId,
    handleOpenCreate: () => {
      setSubmitError(null);
      setFormMode({ kind: "create" });
    },
    handleOpenEdit: (account) => {
      setSubmitError(null);
      setFormMode({ kind: "edit", account });
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
