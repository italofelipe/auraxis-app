import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useSharedEntriesScreenController } from "@/features/shared-entries/hooks/use-shared-entries-screen-controller";
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
import type { InvitationView } from "@/features/shared-entries/services/shared-entries-classifier";

jest.mock("@/features/shared-entries/hooks/use-shared-entries-mutations", () => ({
  useAcceptSharedInvitationMutation: jest.fn(),
  useDeleteSharedEntryMutation: jest.fn(),
  useDeleteSharedInvitationMutation: jest.fn(),
}));
jest.mock("@/features/shared-entries/hooks/use-shared-entries-query", () => ({
  useSharedEntriesByMeQuery: jest.fn(),
  useSharedEntriesWithMeQuery: jest.fn(),
  useSharedInvitationsQuery: jest.fn(),
}));

const mockedAccept = jest.mocked(useAcceptSharedInvitationMutation);
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

describe("useSharedEntriesScreenController", () => {
  let client: QueryClient;
  let acceptMutate: jest.Mock;
  let deleteInvMutate: jest.Mock;
  let deleteEntryMutate: jest.Mock;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    acceptMutate = jest.fn().mockResolvedValue(undefined);
    deleteInvMutate = jest.fn().mockResolvedValue(undefined);
    deleteEntryMutate = jest.fn().mockResolvedValue(undefined);
    mockedAccept.mockReturnValue({ mutateAsync: acceptMutate } as never);
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
});
