import { useMemo, useState } from "react";

import {
  useAcceptSharedInvitationMutation,
  useDeleteSharedEntryMutation,
  useDeleteSharedInvitationMutation,
} from "@/features/shared-entries/hooks/use-shared-entries-mutations";
import {
  useSharedEntriesByMeQuery,
  useSharedEntriesWithMeQuery,
  useSharedInvitationsQuery,
} from "@/features/shared-entries/hooks/use-shared-entries-query";
import {
  sharedEntriesClassifier,
  type EntryView,
  type InvitationView,
} from "@/features/shared-entries/services/shared-entries-classifier";

export type SharedEntriesTab = "invitations" | "byMe" | "withMe";

export interface SharedEntriesScreenController {
  readonly invitationsQuery: ReturnType<typeof useSharedInvitationsQuery>;
  readonly byMeQuery: ReturnType<typeof useSharedEntriesByMeQuery>;
  readonly withMeQuery: ReturnType<typeof useSharedEntriesWithMeQuery>;
  readonly pendingInvitations: readonly InvitationView[];
  readonly byMeEntries: readonly EntryView[];
  readonly withMeEntries: readonly EntryView[];
  readonly selectedTab: SharedEntriesTab;
  readonly setSelectedTab: (tab: SharedEntriesTab) => void;
  readonly pendingInvitationIds: ReadonlySet<string>;
  readonly pendingEntryIds: ReadonlySet<string>;
  readonly lastError: unknown | null;
  readonly handleAccept: (invitation: InvitationView) => Promise<void>;
  readonly handleReject: (invitation: InvitationView) => Promise<void>;
  readonly handleRevoke: (entry: EntryView) => Promise<void>;
  readonly dismissError: () => void;
}

const useTrackedActionIds = () => {
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());

  const begin = (id: string) => {
    setIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  const end = (id: string) => {
    setIds((current) => {
      if (!current.has(id)) {
        return current;
      }
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  return { ids, begin, end };
};

/**
 * Coordinates the shared entries screen: 3 queries (invitations, by me, with
 * me), 3 mutations (accept, reject/delete-invitation, revoke/delete-entry),
 * tab selection, per-record pending state and error capture.
 *
 * Mutations are tracked per record id so multiple actions can run in parallel
 * without blocking the whole list — only the affected card disables.
 */
export function useSharedEntriesScreenController(): SharedEntriesScreenController {
  const invitationsQuery = useSharedInvitationsQuery();
  const byMeQuery = useSharedEntriesByMeQuery();
  const withMeQuery = useSharedEntriesWithMeQuery();
  const acceptMutation = useAcceptSharedInvitationMutation();
  const deleteInvitationMutation = useDeleteSharedInvitationMutation();
  const deleteEntryMutation = useDeleteSharedEntryMutation();

  const [selectedTab, setSelectedTab] = useState<SharedEntriesTab>("invitations");
  const [lastError, setLastError] = useState<unknown | null>(null);
  const invitationActions = useTrackedActionIds();
  const entryActions = useTrackedActionIds();

  const pendingInvitations = useMemo(
    () => sharedEntriesClassifier.pending(invitationsQuery.data?.invitations ?? []),
    [invitationsQuery.data],
  );
  const byMeEntries = useMemo(
    () => sharedEntriesClassifier.entries(byMeQuery.data?.sharedEntries ?? []),
    [byMeQuery.data],
  );
  const withMeEntries = useMemo(
    () => sharedEntriesClassifier.entries(withMeQuery.data?.sharedEntries ?? []),
    [withMeQuery.data],
  );

  const handleAccept = async (invitation: InvitationView): Promise<void> => {
    if (!invitation.token) {
      setLastError(new Error("Convite sem token de aceite."));
      return;
    }
    invitationActions.begin(invitation.id);
    try {
      await acceptMutation.mutateAsync(invitation.token);
    } catch (error) {
      setLastError(error);
    } finally {
      invitationActions.end(invitation.id);
    }
  };

  const handleReject = async (invitation: InvitationView): Promise<void> => {
    invitationActions.begin(invitation.id);
    try {
      await deleteInvitationMutation.mutateAsync(invitation.id);
    } catch (error) {
      setLastError(error);
    } finally {
      invitationActions.end(invitation.id);
    }
  };

  const handleRevoke = async (entry: EntryView): Promise<void> => {
    entryActions.begin(entry.id);
    try {
      await deleteEntryMutation.mutateAsync(entry.id);
    } catch (error) {
      setLastError(error);
    } finally {
      entryActions.end(entry.id);
    }
  };

  return {
    invitationsQuery,
    byMeQuery,
    withMeQuery,
    pendingInvitations,
    byMeEntries,
    withMeEntries,
    selectedTab,
    setSelectedTab,
    pendingInvitationIds: invitationActions.ids,
    pendingEntryIds: entryActions.ids,
    lastError,
    handleAccept,
    handleReject,
    handleRevoke,
    dismissError: () => setLastError(null),
  };
}
