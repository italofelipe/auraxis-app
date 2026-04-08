import type {
  CreateSharedEntryCommand,
  CreateSharedInvitationCommand,
} from "@/features/shared-entries/contracts";
import { queryKeys } from "@/core/query/query-keys";
import {
  useSharedEntriesByMeQuery,
  useSharedEntriesWithMeQuery,
  useSharedInvitationsQuery,
} from "@/features/shared-entries/hooks/use-shared-entries-query";
import {
  useAcceptSharedInvitationMutation,
  useCreateSharedEntryMutation,
  useCreateSharedInvitationMutation,
  useDeleteSharedEntryMutation,
  useDeleteSharedInvitationMutation,
} from "@/features/shared-entries/hooks/use-shared-entries-mutations";

const mockCreateApiQuery = jest.fn();
const mockListByMe = jest.fn();
const mockListWithMe = jest.fn();
const mockListInvitations = jest.fn();
const mockCreateSharedEntry = jest.fn();
const mockDeleteSharedEntry = jest.fn();
const mockCreateInvitation = jest.fn();
const mockAcceptInvitation = jest.fn();
const mockDeleteInvitation = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("@/core/query/create-api-query", () => ({
  createApiQuery: (...args: readonly unknown[]) => mockCreateApiQuery(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (...args: readonly unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock("@/features/shared-entries/services/shared-entries-service", () => ({
  sharedEntriesService: {
    listByMe: (...args: readonly unknown[]) => mockListByMe(...args),
    listWithMe: (...args: readonly unknown[]) => mockListWithMe(...args),
    listInvitations: (...args: readonly unknown[]) => mockListInvitations(...args),
    createSharedEntry: (...args: readonly unknown[]) => mockCreateSharedEntry(...args),
    deleteSharedEntry: (...args: readonly unknown[]) => mockDeleteSharedEntry(...args),
    createInvitation: (...args: readonly unknown[]) => mockCreateInvitation(...args),
    acceptInvitation: (...args: readonly unknown[]) => mockAcceptInvitation(...args),
    deleteInvitation: (...args: readonly unknown[]) => mockDeleteInvitation(...args),
  },
}));

describe("shared-entries hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiQuery.mockImplementation(
      (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) => ({
        queryKey,
        queryFn,
      }),
    );
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });
  });

  it("configura as queries do dominio", async () => {
    mockListByMe.mockResolvedValue({ sharedEntries: [] });
    mockListWithMe.mockResolvedValue({ sharedEntries: [] });
    mockListInvitations.mockResolvedValue({ invitations: [] });

    const byMe = useSharedEntriesByMeQuery() as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    };
    const withMe = useSharedEntriesWithMeQuery() as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    };
    const invitations = useSharedInvitationsQuery() as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    };

    await expect(byMe.queryFn()).resolves.toEqual({ sharedEntries: [] });
    await expect(withMe.queryFn()).resolves.toEqual({ sharedEntries: [] });
    await expect(invitations.queryFn()).resolves.toEqual({ invitations: [] });
    expect(byMe.queryKey).toEqual(queryKeys.sharedEntries.byMe());
    expect(withMe.queryKey).toEqual(queryKeys.sharedEntries.withMe());
    expect(invitations.queryKey).toEqual(queryKeys.sharedEntries.invitations());
  });

  it("configura as mutations e invalida o dominio", async () => {
    const sharedEntryCommand: CreateSharedEntryCommand = {
      transactionId: "txn-1",
      splitType: "equal",
    };
    const invitationCommand: CreateSharedInvitationCommand = {
      sharedEntryId: "share-1",
      inviteeEmail: "ana@auraxis.dev",
    };
    mockCreateSharedEntry.mockResolvedValue({ id: "share-1" });
    mockDeleteSharedEntry.mockResolvedValue({ id: "share-1" });
    mockCreateInvitation.mockResolvedValue({ id: "inv-1" });
    mockAcceptInvitation.mockResolvedValue({ id: "inv-1" });
    mockDeleteInvitation.mockResolvedValue({ id: "inv-1" });

    const createEntry = useCreateSharedEntryMutation() as unknown as {
      mutationFn: (input: CreateSharedEntryCommand) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const deleteEntry = useDeleteSharedEntryMutation() as unknown as {
      mutationFn: (id: string) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const createInvitation = useCreateSharedInvitationMutation() as unknown as {
      mutationFn: (input: CreateSharedInvitationCommand) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const acceptInvitation = useAcceptSharedInvitationMutation() as unknown as {
      mutationFn: (token: string) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const deleteInvitation = useDeleteSharedInvitationMutation() as unknown as {
      mutationFn: (id: string) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };

    await createEntry.mutationFn(sharedEntryCommand);
    await deleteEntry.mutationFn("share-1");
    await createInvitation.mutationFn(invitationCommand);
    await acceptInvitation.mutationFn("token-1");
    await deleteInvitation.mutationFn("inv-1");
    await createEntry.onSuccess();
    await deleteEntry.onSuccess();
    await createInvitation.onSuccess();
    await acceptInvitation.onSuccess();
    await deleteInvitation.onSuccess();

    expect(mockCreateSharedEntry).toHaveBeenCalledWith(sharedEntryCommand);
    expect(mockDeleteSharedEntry).toHaveBeenCalledWith("share-1");
    expect(mockCreateInvitation).toHaveBeenCalledWith(invitationCommand);
    expect(mockAcceptInvitation).toHaveBeenCalledWith("token-1");
    expect(mockDeleteInvitation).toHaveBeenCalledWith("inv-1");
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(5);
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.sharedEntries.root,
    });
  });
});
