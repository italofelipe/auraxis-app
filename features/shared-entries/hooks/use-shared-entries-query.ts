import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  SharedEntryListResponse,
  SharedInvitationListResponse,
} from "@/features/shared-entries/contracts";
import { sharedEntriesService } from "@/features/shared-entries/services/shared-entries-service";

export const useSharedEntriesByMeQuery = () => {
  return createApiQuery<SharedEntryListResponse>(
    queryKeys.sharedEntries.byMe(),
    () => sharedEntriesService.listByMe(),
  );
};

export const useSharedEntriesWithMeQuery = () => {
  return createApiQuery<SharedEntryListResponse>(
    queryKeys.sharedEntries.withMe(),
    () => sharedEntriesService.listWithMe(),
  );
};

export const useSharedInvitationsQuery = () => {
  return createApiQuery<SharedInvitationListResponse>(
    queryKeys.sharedEntries.invitations(),
    () => sharedEntriesService.listInvitations(),
  );
};
