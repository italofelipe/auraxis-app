import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  CreateTagCommand,
  Tag,
  TagListResponse,
  UpdateTagCommand,
} from "@/features/tags/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface TagPayload {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  readonly icon: string | null;
}

const mapTag = (payload: TagPayload): Tag => ({
  id: payload.id,
  name: payload.name,
  color: payload.color,
  icon: payload.icon,
});

const buildPayload = (
  command: CreateTagCommand | Omit<UpdateTagCommand, "tagId">,
) => ({
  name: command.name,
  color: command.color ?? null,
  icon: command.icon ?? null,
});

export const createTagsService = (client: AxiosInstance) => ({
  listTags: async (): Promise<TagListResponse> => {
    const response = await client.get(apiContractMap.tagsList.path);
    const payload = unwrapEnvelopeData<{ readonly tags: TagPayload[] }>(
      response.data,
    );
    return { tags: payload.tags.map(mapTag) };
  },
  createTag: async (command: CreateTagCommand): Promise<Tag> => {
    const response = await client.post(
      apiContractMap.tagsCreate.path,
      buildPayload(command),
    );
    const payload = unwrapEnvelopeData<{ readonly tag: TagPayload }>(response.data);
    return mapTag(payload.tag);
  },
  updateTag: async (command: UpdateTagCommand): Promise<Tag> => {
    const { tagId, ...rest } = command;
    const response = await client.put(
      resolveApiContractPath(apiContractMap.tagUpdate.path, { tag_id: tagId }),
      buildPayload(rest),
    );
    const payload = unwrapEnvelopeData<{ readonly tag: TagPayload }>(response.data);
    return mapTag(payload.tag);
  },
  deleteTag: async (tagId: string): Promise<void> => {
    await client.delete(
      resolveApiContractPath(apiContractMap.tagDelete.path, { tag_id: tagId }),
    );
  },
});

export const tagsService = createTagsService(httpClient);
