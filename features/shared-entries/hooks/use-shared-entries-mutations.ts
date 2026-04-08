import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateSharedEntryCommand,
  CreateSharedInvitationCommand,
  SharedEntryRecord,
  SharedInvitationRecord,
} from "@/features/shared-entries/contracts";
import { sharedEntriesService } from "@/features/shared-entries/services/shared-entries-service";

export const useCreateSharedEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SharedEntryRecord, Error, CreateSharedEntryCommand>({
    mutationFn: (command) => sharedEntriesService.createSharedEntry(command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sharedEntries.root });
    },
  });
};

export const useDeleteSharedEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SharedEntryRecord, Error, string>({
    mutationFn: (sharedEntryId) => sharedEntriesService.deleteSharedEntry(sharedEntryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sharedEntries.root });
    },
  });
};

export const useCreateSharedInvitationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SharedInvitationRecord, Error, CreateSharedInvitationCommand>({
    mutationFn: (command) => sharedEntriesService.createInvitation(command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sharedEntries.root });
    },
  });
};

export const useAcceptSharedInvitationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SharedInvitationRecord, Error, string>({
    mutationFn: (token) => sharedEntriesService.acceptInvitation(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sharedEntries.root });
    },
  });
};

export const useDeleteSharedInvitationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SharedInvitationRecord, Error, string>({
    mutationFn: (invitationId) => sharedEntriesService.deleteInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sharedEntries.root });
    },
  });
};
