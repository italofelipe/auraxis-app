import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  sessionStateDefaults,
  useSessionStore,
} from "@/core/session/session-store";
import { useSharedEntriesScreenController } from "@/features/shared-entries/hooks/use-shared-entries-screen-controller";
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
import type { SharedEntryRecord } from "@/features/shared-entries/contracts";
import type { InvitationView } from "@/features/shared-entries/services/shared-entries-classifier";

jest.mock("@/features/shared-entries/hooks/use-shared-entries-mutations", () => ({
  useAcceptSharedInvitationMutation: jest.fn(),
  useCreateSharedInvitationMutation: jest.fn(),
  useDeleteSharedEntryMutation: jest.fn(),
  useDeleteSharedInvitationMutation: jest.fn(),
}));
jest.mock("@/features/shared-entries/hooks/use-shared-entries-query", () => ({
  useSharedEntriesByMeQuery: jest.fn(),
  useSharedEntriesWithMeQuery: jest.fn(),
  useSharedInvitationsQuery: jest.fn(),
}));

const mockedAccept = jest.mocked(useAcceptSharedInvitationMutation);
const mockedCreateInv = jest.mocked(useCreateSharedInvitationMutation);
const mockedDeleteInv = jest.mocked(useDeleteSharedInvitationMutation);
const mockedDeleteEntry = jest.mocked(useDeleteSharedEntryMutation);
const mockedByMe = jest.mocked(useSharedEntriesByMeQuery);
const mockedWithMe = jest.mocked(useSharedEntriesWithMeQuery);
const mockedInvitations = jest.mocked(useSharedInvitationsQuery);

const wrapper = (client: QueryClient) => {
  const Provider = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Provider.displayName = "TestQueryClientProvider";
  return Provider;
};

const buildInvitationView = (
  override: Partial<InvitationView> = {},
): InvitationView => ({
  id: "inv-1",
  sharedEntryId: "se-1",
  fromUserId: "u-1",
  toUserEmail: "x@y.com",
  toUserId: null,
  splitValue: 50,
  shareAmount: null,
  message: null,
  status: "pending",
  token: "tok-1",
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  createdAt: "2026-04-01T00:00:00Z",
  respondedAt: null,
  bucket: "pending",
  isExpired: false,
  shareLabel: "Sua parte: 50%",
  ...override,
});

const buildEntryRecord = (
  override: Partial<SharedEntryRecord> = {},
): SharedEntryRecord => ({
  id: "se-1",
  ownerId: "u-1",
  transactionId: "tx-1",
  status: "active",
  splitType: "equal",
  transactionTitle: "Aluguel",
  transactionAmount: 2000,
  myShare: 1000,
  otherPartyEmail: "x@y.com",
  createdAt: "2026-04-01T00:00:00Z",
  updatedAt: "2026-04-01T00:00:00Z",
  ...override,
});

  let client: QueryClient;
  let acceptMutate: jest.Mock;
  let createInvMutate: jest.Mock;
  let deleteInvMutate: jest.Mock;
  let deleteEntryMutate: jest.Mock;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    acceptMutate = jest.fn().mockResolvedValue(undefined);
    createInvMutate = jest.fn().mockResolvedValue(undefined);
    deleteInvMutate = jest.fn().mockResolvedValue(undefined);
    deleteEntryMutate = jest.fn().mockResolvedValue(undefined);
    useSessionStore.setState({
      ...sessionStateDefaults,
      hydrated: true,
    });
    mockedAccept.mockReturnValue({ mutateAsync: acceptMutate } as never);
    mockedCreateInv.mockReturnValue({
      isPending: false,
      mutateAsync: createInvMutate,
    } as never);
    mockedDeleteInv.mockReturnValue({ mutateAsync: deleteInvMutate } as never);
    mockedDeleteEntry.mockReturnValue({ mutateAsync: deleteEntryMutate } as never);
    mockedInvitations.mockReturnValue({
      data: { invitations: [] },
      isPending: false,
    } as never);
    mockedByMe.mockReturnValue({
      data: { sharedEntries: [] },
      isPending: false,
    } as never);
    mockedWithMe.mockReturnValue({
      data: { sharedEntries: [] },
      isPending: false,
    } as never);
  });

  it("aceita convite via token", async () => {
    const invitation = buildInvitationView();
    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleAccept(invitation);
    });

    expect(acceptMutate).toHaveBeenCalledWith("tok-1");
  });

  it("captura erro quando convite nao tem token", async () => {
    const invitation = buildInvitationView({ token: null });
    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleAccept(invitation);
    });

    expect(acceptMutate).not.toHaveBeenCalled();
    expect(result.current.lastError).toBeInstanceOf(Error);
  });

  it("rejeita convite via delete pelo id", async () => {
    const invitation = buildInvitationView();
    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleReject(invitation);
    });

    expect(deleteInvMutate).toHaveBeenCalledWith("inv-1");
  });

  it("revoga shared entry pelo id", async () => {
    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleRevoke({ id: "se-1" } as never);
    });

    expect(deleteEntryMutate).toHaveBeenCalledWith("se-1");
  });

  it("alterna tab via setSelectedTab", () => {
    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });
    act(() => {
      result.current.setSelectedTab("byMe");
    });
    expect(result.current.selectedTab).toBe("byMe");
  });

  it("calcula contadores de tabs e resumo para paridade mobile", () => {
    mockedInvitations.mockReturnValue({
      data: { invitations: [buildInvitationView()] },
      isPending: false,
    } as never);
    mockedByMe.mockReturnValue({
      data: { sharedEntries: [buildEntryRecord({ id: "by-me-1" })] },
      isPending: false,
    } as never);
    mockedWithMe.mockReturnValue({
      data: {
        sharedEntries: [
          buildEntryRecord({ id: "with-me-1", status: "accepted" }),
          buildEntryRecord({ id: "with-me-2", status: "completed" }),
        ],
      },
      isPending: false,
    } as never);

    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    expect(result.current.tabCounts).toEqual({
      invitations: 1,
      byMe: 1,
      withMe: 2,
    });
    expect(result.current.summary).toEqual({
      totalEntries: 3,
      activeEntries: 2,
      pendingInvitations: 1,
    });
  });

  it("separa convites recebidos pendentes de convites enviados pelo usuario", () => {
    useSessionStore.setState({
      user: {
        id: "current-user",
        email: "me@example.com",
        name: "Italo",
        emailConfirmed: true,
      },
    } as never);
    mockedInvitations.mockReturnValue({
      data: {
        invitations: [
          buildInvitationView({
            id: "sent",
            fromUserId: "current-user",
            toUserEmail: "friend@example.com",
          }),
          buildInvitationView({
            id: "received",
            fromUserId: "other-user",
            toUserEmail: "me@example.com",
          }),
        ],
      },
      isPending: false,
    } as never);

    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    expect(result.current.pendingInvitations.map((invitation) => invitation.id)).toEqual([
      "received",
    ]);
    expect(result.current.outgoingInvitations.map((invitation) => invitation.id)).toEqual([
      "sent",
    ]);
  });

  it("cria convite enviado com payload normalizado", async () => {
    mockedByMe.mockReturnValue({
      data: { sharedEntries: [buildEntryRecord({ id: "se-1" })] },
      isPending: false,
    } as never);
    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    act(() => {
      result.current.selectInvitationEntry("se-1");
      result.current.setInvitationFormField("inviteeEmail", " partner@example.com ");
      result.current.setInvitationFormField("splitValue", "40");
      result.current.setInvitationFormField("message", "  aluguel de julho  ");
    });
    await act(async () => {
      await result.current.handleCreateInvitation();
    });

    expect(createInvMutate).toHaveBeenCalledWith({
      sharedEntryId: "se-1",
      inviteeEmail: "partner@example.com",
      splitValue: 40,
      shareAmount: null,
      message: "aluguel de julho",
      expiresInHours: 168,
    });
  });

  it("revoga convite enviado pelo id", async () => {
    const invitation = buildInvitationView({
      id: "out-1",
      fromUserId: "current-user",
      toUserEmail: "partner@example.com",
    });
    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleRevokeInvitation(invitation);
    });

    expect(deleteInvMutate).toHaveBeenCalledWith("out-1");
  });

  it("captura erro quando accept rejeita e mantem outras invitations destrancadas", async () => {
    acceptMutate.mockRejectedValueOnce(new Error("boom"));
    const invitation = buildInvitationView();
    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleAccept(invitation);
    });

    expect(result.current.lastError).toBeInstanceOf(Error);
    expect(result.current.pendingInvitationIds.has("inv-1")).toBe(false);
  });

  it("dismissError limpa lastError", async () => {
    acceptMutate.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useSharedEntriesScreenController(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.handleAccept(buildInvitationView());
    });
    act(() => {
      result.current.dismissError();
    });
    expect(result.current.lastError).toBeNull();
  });
