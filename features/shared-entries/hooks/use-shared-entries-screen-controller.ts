import { useEffect, useMemo, useState } from "react";

import { useSessionStore } from "@/core/session/session-store";
import type { CreateSharedInvitationCommand } from "@/features/shared-entries/contracts";
import {
  useAcceptSharedInvitationMutation,
  useCreateSharedInvitationMutation,
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

export interface SharedInvitationFormState {
  readonly sharedEntryId: string;
  readonly inviteeEmail: string;
  readonly splitValue: string;
  readonly shareAmount: string;
  readonly message: string;
  readonly expiresInHours: string;
}

export type SharedInvitationFormField = keyof SharedInvitationFormState;

export interface SharedEntriesScreenController {
  readonly invitationsQuery: ReturnType<typeof useSharedInvitationsQuery>;
  readonly byMeQuery: ReturnType<typeof useSharedEntriesByMeQuery>;
  readonly withMeQuery: ReturnType<typeof useSharedEntriesWithMeQuery>;
  readonly pendingInvitations: readonly InvitationView[];
  readonly byMeEntries: readonly EntryView[];
  readonly withMeEntries: readonly EntryView[];
  readonly activeByMeEntries: readonly EntryView[];
  readonly outgoingInvitations: readonly InvitationView[];
  readonly tabCounts: SharedEntriesTabCounts;
  readonly summary: SharedEntriesSummary;
  readonly selectedTab: SharedEntriesTab;
  readonly setSelectedTab: (tab: SharedEntriesTab) => void;
  readonly pendingInvitationIds: ReadonlySet<string>;
  readonly pendingEntryIds: ReadonlySet<string>;
  readonly invitationForm: SharedInvitationFormState;
  readonly invitationFormError: string | null;
  readonly isCreatingInvitation: boolean;
  readonly lastError: unknown | null;
  readonly setInvitationFormField: (
    field: SharedInvitationFormField,
    value: string,
  ) => void;
  readonly selectInvitationEntry: (sharedEntryId: string) => void;
  readonly handleCreateInvitation: () => Promise<void>;
  readonly handleAccept: (invitation: InvitationView) => Promise<void>;
  readonly handleReject: (invitation: InvitationView) => Promise<void>;
  readonly handleRevoke: (entry: EntryView) => Promise<void>;
  readonly handleRevokeInvitation: (invitation: InvitationView) => Promise<void>;
  readonly dismissError: () => void;
}

const DEFAULT_INVITATION_FORM: SharedInvitationFormState = {
  sharedEntryId: "",
  inviteeEmail: "",
  splitValue: "50",
  shareAmount: "",
  message: "",
  expiresInHours: "168",
};

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

interface NumberParseResult {
  readonly value: number | null;
  readonly error: string | null;
}

const normalizeNumberInput = (value: string): string => {
  return value.trim().replace(/\s/g, "").replace(",", ".");
};

const parseOptionalNumber = (value: string, label: string): NumberParseResult => {
  const normalized = normalizeNumberInput(value);
  if (!normalized) {
    return { value: null, error: null };
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { value: null, error: `${label} deve ser maior que zero.` };
  }

  return { value: parsed, error: null };
};

const parseOptionalPercent = (value: string): NumberParseResult => {
  const result = parseOptionalNumber(value, "Percentual");
  if (result.error || result.value === null) {
    return result;
  }

  if (result.value > 100) {
    return { value: null, error: "Percentual deve ser no maximo 100." };
  }

  return result;
};

const parseExpiryHours = (value: string): NumberParseResult => {
  const result = parseOptionalNumber(value, "Validade");
  if (result.error || result.value === null) {
    return result.error ? result : { value: 168, error: null };
  }

  if (!Number.isInteger(result.value)) {
    return { value: null, error: "Validade deve ser um numero inteiro de horas." };
  }

  return result;
};

interface InvitationCommandResult {
  readonly command: CreateSharedInvitationCommand | null;
  readonly error: string | null;
}

interface InvitationTargetResult {
  readonly sharedEntryId: string;
  readonly inviteeEmail: string;
  readonly error: string | null;
}

const resolveInvitationTarget = (
  form: SharedInvitationFormState,
): InvitationTargetResult => {
  const sharedEntryId = form.sharedEntryId.trim();
  if (!sharedEntryId) {
    return {
      sharedEntryId: "",
      inviteeEmail: "",
      error: "Selecione um compartilhamento ativo para convidar.",
    };
  }

  const inviteeEmail = form.inviteeEmail.trim().toLowerCase();
  if (!inviteeEmail || !inviteeEmail.includes("@")) {
    return {
      sharedEntryId,
      inviteeEmail: "",
      error: "Informe um email valido para o convite.",
    };
  }

  return { sharedEntryId, inviteeEmail, error: null };
};

const buildCreateInvitationCommand = (
  form: SharedInvitationFormState,
): InvitationCommandResult => {
  const target = resolveInvitationTarget(form);
  if (target.error) {
    return { command: null, error: target.error };
  }

  const shareAmount = parseOptionalNumber(form.shareAmount, "Valor exato");
  if (shareAmount.error) {
    return { command: null, error: shareAmount.error };
  }

  const splitValue = parseOptionalPercent(form.splitValue);
  if (splitValue.error) {
    return { command: null, error: splitValue.error };
  }

  if (shareAmount.value === null && splitValue.value === null) {
    return {
      command: null,
      error: "Informe percentual ou valor exato da parte convidada.",
    };
  }

  const expiresInHours = parseExpiryHours(form.expiresInHours);
  if (expiresInHours.error) {
    return { command: null, error: expiresInHours.error };
  }

  const message = form.message.trim();

  return {
    command: {
      sharedEntryId: target.sharedEntryId,
      inviteeEmail: target.inviteeEmail,
      splitValue: shareAmount.value === null ? splitValue.value : null,
      shareAmount: shareAmount.value,
      message: message || null,
      expiresInHours: expiresInHours.value ?? 168,
    },
    error: null,
  };
};

interface SharedEntriesQueries {
  readonly invitationsQuery: ReturnType<typeof useSharedInvitationsQuery>;
  readonly byMeQuery: ReturnType<typeof useSharedEntriesByMeQuery>;
  readonly withMeQuery: ReturnType<typeof useSharedEntriesWithMeQuery>;
}

interface SharedEntriesMutations {
  readonly createInvitationMutation: ReturnType<typeof useCreateSharedInvitationMutation>;
  readonly acceptMutation: ReturnType<typeof useAcceptSharedInvitationMutation>;
  readonly deleteInvitationMutation: ReturnType<typeof useDeleteSharedInvitationMutation>;
  readonly deleteEntryMutation: ReturnType<typeof useDeleteSharedEntryMutation>;
}

interface SharedEntriesClassifiedLists {
  readonly pendingInvitations: readonly InvitationView[];
  readonly outgoingInvitations: readonly InvitationView[];
  readonly byMeEntries: readonly EntryView[];
  readonly withMeEntries: readonly EntryView[];
  readonly activeByMeEntries: readonly EntryView[];
  readonly metrics: SharedEntriesMetrics;
}

interface SharedInvitationFormController {
  readonly invitationForm: SharedInvitationFormState;
  readonly invitationFormError: string | null;
  readonly isCreatingInvitation: boolean;
  readonly setInvitationFormField: (
    field: SharedInvitationFormField,
    value: string,
  ) => void;
  readonly selectInvitationEntry: (sharedEntryId: string) => void;
  readonly handleCreateInvitation: () => Promise<void>;
}

interface SharedEntriesActionHandlers {
  readonly handleAccept: (invitation: InvitationView) => Promise<void>;
  readonly handleReject: (invitation: InvitationView) => Promise<void>;
  readonly handleRevoke: (entry: EntryView) => Promise<void>;
  readonly handleRevokeInvitation: (invitation: InvitationView) => Promise<void>;
}

const useSharedEntriesQueries = (): SharedEntriesQueries => {
  return {
    invitationsQuery: useSharedInvitationsQuery(),
    byMeQuery: useSharedEntriesByMeQuery(),
    withMeQuery: useSharedEntriesWithMeQuery(),
  };
};

const useSharedEntriesMutations = (): SharedEntriesMutations => {
  return {
    createInvitationMutation: useCreateSharedInvitationMutation(),
    acceptMutation: useAcceptSharedInvitationMutation(),
    deleteInvitationMutation: useDeleteSharedInvitationMutation(),
    deleteEntryMutation: useDeleteSharedEntryMutation(),
  };
};

const useClassifiedSharedEntries = (
  queries: SharedEntriesQueries,
  currentUserId: string | null,
): SharedEntriesClassifiedLists => {
  const pendingInvitations = useMemo(
    () =>
      sharedEntriesClassifier.incomingPending(
        queries.invitationsQuery.data?.invitations ?? [],
        currentUserId,
      ),
    [currentUserId, queries.invitationsQuery.data],
  );
  const outgoingInvitations = useMemo(
    () =>
      sharedEntriesClassifier.outgoing(
        queries.invitationsQuery.data?.invitations ?? [],
        currentUserId,
      ),
    [currentUserId, queries.invitationsQuery.data],
  );
  const byMeEntries = useMemo(
    () => sharedEntriesClassifier.entries(queries.byMeQuery.data?.sharedEntries ?? []),
    [queries.byMeQuery.data],
  );
  const withMeEntries = useMemo(
    () =>
      sharedEntriesClassifier.entries(queries.withMeQuery.data?.sharedEntries ?? []),
    [queries.withMeQuery.data],
  );
  const activeByMeEntries = useMemo(
    () => byMeEntries.filter((entry) => entry.bucket === "active"),
    [byMeEntries],
  );
  const metrics = useMemo(
    () => buildSharedEntriesMetrics({ pendingInvitations, byMeEntries, withMeEntries }),
    [byMeEntries, pendingInvitations, withMeEntries],
  );

  return {
    pendingInvitations,
    outgoingInvitations,
    byMeEntries,
    withMeEntries,
    activeByMeEntries,
    metrics,
  };
};

const useSharedInvitationFormController = ({
  activeByMeEntries,
  createInvitationMutation,
  setLastError,
}: {
  readonly activeByMeEntries: readonly EntryView[];
  readonly createInvitationMutation: ReturnType<typeof useCreateSharedInvitationMutation>;
  readonly setLastError: (error: unknown) => void;
}): SharedInvitationFormController => {
  const [invitationForm, setInvitationForm] = useState<SharedInvitationFormState>(
    DEFAULT_INVITATION_FORM,
  );
  const [invitationFormError, setInvitationFormError] = useState<string | null>(null);

  useEffect(() => {
    setInvitationForm((current) =>
      reconcileSelectedInvitationEntry(current, activeByMeEntries),
    );
  }, [activeByMeEntries]);

  const setInvitationFormField = (
    field: SharedInvitationFormField,
    value: string,
  ): void => {
    setInvitationForm((current) => ({ ...current, [field]: value }));
    setInvitationFormError(null);
  };

  const selectInvitationEntry = (sharedEntryId: string): void => {
    setInvitationForm((current) => ({ ...current, sharedEntryId }));
    setInvitationFormError(null);
  };

  const handleCreateInvitation = async (): Promise<void> => {
    const result = buildCreateInvitationCommand(invitationForm);
    if (result.error || !result.command) {
      setInvitationFormError(result.error ?? "Nao foi possivel montar o convite.");
      return;
    }

    setInvitationFormError(null);
    try {
      await createInvitationMutation.mutateAsync(result.command);
      setInvitationForm((current) => ({
        ...DEFAULT_INVITATION_FORM,
        sharedEntryId: current.sharedEntryId,
      }));
    } catch (error) {
      setLastError(error);
    }
  };

  return {
    invitationForm,
    invitationFormError,
    isCreatingInvitation: createInvitationMutation.isPending,
    setInvitationFormField,
    selectInvitationEntry,
    handleCreateInvitation,
  };
};

const reconcileSelectedInvitationEntry = (
  current: SharedInvitationFormState,
  activeByMeEntries: readonly EntryView[],
): SharedInvitationFormState => {
  const firstActiveId = activeByMeEntries[0]?.id ?? "";
  const stillSelectable = activeByMeEntries.some((entry) => {
    return entry.id === current.sharedEntryId;
  });

  if (stillSelectable || current.sharedEntryId === firstActiveId) {
    return current;
  }

  return { ...current, sharedEntryId: firstActiveId };
};

const useSharedEntriesActionHandlers = ({
  acceptMutation,
  deleteEntryMutation,
  deleteInvitationMutation,
  entryActions,
  invitationActions,
  setLastError,
}: {
  readonly acceptMutation: ReturnType<typeof useAcceptSharedInvitationMutation>;
  readonly deleteEntryMutation: ReturnType<typeof useDeleteSharedEntryMutation>;
  readonly deleteInvitationMutation: ReturnType<typeof useDeleteSharedInvitationMutation>;
  readonly entryActions: TrackedActionIds;
  readonly invitationActions: TrackedActionIds;
  readonly setLastError: (error: unknown) => void;
}): SharedEntriesActionHandlers => {
  const handleAccept = async (invitation: InvitationView): Promise<void> => {
    if (!invitation.token) {
      setLastError(new Error("Convite sem token de aceite."));
      return;
    }
    await runTrackedAction({
      id: invitation.id,
      actions: invitationActions,
      action: () => acceptMutation.mutateAsync(invitation.token ?? ""),
      setLastError,
    });
  };

  const handleInvitationDelete = async (invitation: InvitationView): Promise<void> => {
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
    handleAccept,
    handleReject: handleInvitationDelete,
    handleRevoke,
    handleRevokeInvitation: handleInvitationDelete,
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
  const currentUserId = useSessionStore((state) => state.user?.id ?? null);
  const queries = useSharedEntriesQueries();
  const mutations = useSharedEntriesMutations();
  const [selectedTab, setSelectedTab] = useState<SharedEntriesTab>("invitations");
  const [lastError, setLastError] = useState<unknown | null>(null);
  const invitationActions = useTrackedActionIds();
  const entryActions = useTrackedActionIds();
  const lists = useClassifiedSharedEntries(queries, currentUserId);
  const formController = useSharedInvitationFormController({
    activeByMeEntries: lists.activeByMeEntries,
    createInvitationMutation: mutations.createInvitationMutation,
    setLastError,
  });
  const handlers = useSharedEntriesActionHandlers({
    ...mutations,
    entryActions,
    invitationActions,
    setLastError,
  });

  return {
    invitationsQuery: queries.invitationsQuery,
    byMeQuery: queries.byMeQuery,
    withMeQuery: queries.withMeQuery,
    pendingInvitations: lists.pendingInvitations,
    byMeEntries: lists.byMeEntries,
    withMeEntries: lists.withMeEntries,
    activeByMeEntries: lists.activeByMeEntries,
    outgoingInvitations: lists.outgoingInvitations,
    tabCounts: lists.metrics.tabCounts,
    summary: lists.metrics.summary,
    selectedTab,
    setSelectedTab,
    pendingInvitationIds: invitationActions.ids,
    pendingEntryIds: entryActions.ids,
    ...formController,
    lastError,
    ...handlers,
    dismissError: () => setLastError(null),
  };
}
