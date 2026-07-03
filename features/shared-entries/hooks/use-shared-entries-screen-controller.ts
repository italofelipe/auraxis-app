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

export type SharedEntriesTabCounts = Readonly<Record<SharedEntriesTab, number>>;

export interface SharedEntriesSummary {
  readonly totalEntries: number;
  readonly activeEntries: number;
  readonly pendingInvitations: number;
}

interface SharedEntriesMetrics {
  readonly tabCounts: SharedEntriesTabCounts;
  readonly summary: SharedEntriesSummary;
}

export interface SharedEntriesScreenController {
  readonly invitationsQuery: ReturnType<typeof useSharedInvitationsQuery>;
  readonly byMeQuery: ReturnType<typeof useSharedEntriesByMeQuery>;
  readonly withMeQuery: ReturnType<typeof useSharedEntriesWithMeQuery>;
  readonly pendingInvitations: readonly InvitationView[];
  readonly byMeEntries: readonly EntryView[];
  readonly withMeEntries: readonly EntryView[];
  readonly tabCounts: SharedEntriesTabCounts;
  readonly summary: SharedEntriesSummary;
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

type TrackedActionIds = ReturnType<typeof useTrackedActionIds>;

interface RunTrackedActionParams {
  readonly id: string;
  readonly actions: TrackedActionIds;
  readonly action: () => Promise<unknown>;
  readonly setLastError: (error: unknown) => void;
}

const runTrackedAction = async ({
  id,
  actions,
  action,
  setLastError,
}: RunTrackedActionParams): Promise<void> => {
  actions.begin(id);
  try {
    await action();
  } catch (error) {
    setLastError(error);
  } finally {
    actions.end(id);
  }
};

const buildSharedEntriesMetrics = ({
  pendingInvitations,
  byMeEntries,
  withMeEntries,
}: {
  readonly pendingInvitations: readonly InvitationView[];
  readonly byMeEntries: readonly EntryView[];
  readonly withMeEntries: readonly EntryView[];
}): SharedEntriesMetrics => {
  const allEntries = [...byMeEntries, ...withMeEntries];
  return {
    tabCounts: {
      invitations: pendingInvitations.length,
      byMe: byMeEntries.length,
      withMe: withMeEntries.length,
    },
    summary: {
      totalEntries: allEntries.length,
      activeEntries: allEntries.filter((entry) => entry.bucket === "active").length,
      pendingInvitations: pendingInvitations.length,
    },
  };
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
  const metrics = useMemo(
    () => buildSharedEntriesMetrics({ pendingInvitations, byMeEntries, withMeEntries }),
    [byMeEntries, pendingInvitations, withMeEntries],
  );

  const handleAccept = async (invitation: InvitationView): Promise<void> => {
    const token = invitation.token;
    if (!token) {
      setLastError(new Error("Convite sem token de aceite."));
      return;
    }
    await runTrackedAction({
      id: invitation.id,
      actions: invitationActions,
      action: () => acceptMutation.mutateAsync(token),
      setLastError,
    });
  };

  const handleReject = async (invitation: InvitationView): Promise<void> => {
    await runTrackedAction({
      id: invitation.id,
      actions: invitationActions,
      action: () => deleteInvitationMutation.mutateAsync(invitation.id),
      setLastError,
    });
  };

  const handleRevoke = async (entry: EntryView): Promise<void> => {
    await runTrackedAction({
      id: entry.id,
      actions: entryActions,
      action: () => deleteEntryMutation.mutateAsync(entry.id),
      setLastError,
    });
  };

  return {
    invitationsQuery,
    byMeQuery,
    withMeQuery,
    pendingInvitations,
    byMeEntries,
    withMeEntries,
    tabCounts: metrics.tabCounts,
    summary: metrics.summary,
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
