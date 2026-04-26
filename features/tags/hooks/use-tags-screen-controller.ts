import { useState } from "react";

import type { Tag } from "@/features/tags/contracts";
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useUpdateTagMutation,
} from "@/features/tags/hooks/use-tags-mutations";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import type { CreateTagFormValues } from "@/features/tags/validators";

export type TagFormMode =
  | { readonly kind: "closed" }
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly tag: Tag };

export interface TagsScreenController {
  readonly tagsQuery: ReturnType<typeof useTagsQuery>;
  readonly tags: readonly Tag[];
  readonly formMode: TagFormMode;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly deletingTagId: string | null;
  readonly handleOpenCreate: () => void;
  readonly handleOpenEdit: (tag: Tag) => void;
  readonly handleCloseForm: () => void;
  readonly handleSubmit: (values: CreateTagFormValues) => Promise<void>;
  readonly handleDelete: (tagId: string) => Promise<void>;
  readonly dismissSubmitError: () => void;
}

interface SubmitDeps {
  readonly formMode: TagFormMode;
  readonly createMutation: ReturnType<typeof useCreateTagMutation>;
  readonly updateMutation: ReturnType<typeof useUpdateTagMutation>;
  readonly setFormMode: (mode: TagFormMode) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildSubmitHandler = ({
  formMode,
  createMutation,
  updateMutation,
  setFormMode,
  setSubmitError,
}: SubmitDeps) => {
  return async (values: CreateTagFormValues): Promise<void> => {
    setSubmitError(null);
    try {
      if (formMode.kind === "edit") {
        await updateMutation.mutateAsync({ tagId: formMode.tag.id, ...values });
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
  readonly deleteMutation: ReturnType<typeof useDeleteTagMutation>;
  readonly setDeletingTagId: (id: string | null) => void;
  readonly setSubmitError: (error: unknown | null) => void;
}

const buildDeleteHandler = ({
  deleteMutation,
  setDeletingTagId,
  setSubmitError,
}: DeleteDeps) => {
  return async (tagId: string): Promise<void> => {
    setDeletingTagId(tagId);
    try {
      await deleteMutation.mutateAsync(tagId);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setDeletingTagId(null);
    }
  };
};

export function useTagsScreenController(): TagsScreenController {
  const tagsQuery = useTagsQuery();
  const createMutation = useCreateTagMutation();
  const updateMutation = useUpdateTagMutation();
  const deleteMutation = useDeleteTagMutation();
  const [formMode, setFormMode] = useState<TagFormMode>({ kind: "closed" });
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  const handleSubmit = buildSubmitHandler({
    formMode,
    createMutation,
    updateMutation,
    setFormMode,
    setSubmitError,
  });

  const handleDelete = buildDeleteHandler({
    deleteMutation,
    setDeletingTagId,
    setSubmitError,
  });

  return {
    tagsQuery,
    tags: tagsQuery.data?.tags ?? [],
    formMode,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
    deletingTagId,
    handleOpenCreate: () => {
      setSubmitError(null);
      setFormMode({ kind: "create" });
    },
    handleOpenEdit: (tag) => {
      setSubmitError(null);
      setFormMode({ kind: "edit", tag });
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
