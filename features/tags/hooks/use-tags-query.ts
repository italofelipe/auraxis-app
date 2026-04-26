import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { TagListResponse } from "@/features/tags/contracts";
import { tagsService } from "@/features/tags/services/tags-service";

export const useTagsQuery = () => {
  return createApiQuery<TagListResponse>(queryKeys.tags.list(), () =>
    tagsService.listTags(),
  );
};
