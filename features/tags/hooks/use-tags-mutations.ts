import { useQueryClient } from "@tanstack/react-query";

import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateTagCommand,
  Tag,
  UpdateTagCommand,
} from "@/features/tags/contracts";
import { tagsService } from "@/features/tags/services/tags-service";

const useInvalidateTags = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.tags.root });
  };
};

export const useCreateTagMutation = () => {
  const invalidate = useInvalidateTags();
  return createApiMutation<Tag, CreateTagCommand>(
    (command) => tagsService.createTag(command),
    { onSuccess: invalidate },
  );
};

export const useUpdateTagMutation = () => {
  const invalidate = useInvalidateTags();
  return createApiMutation<Tag, UpdateTagCommand>(
    (command) => tagsService.updateTag(command),
    { onSuccess: invalidate },
  );
};

export const useDeleteTagMutation = () => {
  const invalidate = useInvalidateTags();
  return createApiMutation<void, string>(
    (tagId) => tagsService.deleteTag(tagId),
    { onSuccess: invalidate },
  );
};
