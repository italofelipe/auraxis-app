import type {
  SharedEntryListResponse,
  SharedInvitationListResponse,
} from "@/features/shared-entries/contracts";

export const sharedEntriesByMeFixture: SharedEntryListResponse = {
  sharedEntries: [
    {
      id: "shared-entry-1",
      ownerId: "user-1",
      transactionId: "tx-2",
      status: "active",
      splitType: "equal",
      transactionTitle: "Aluguel",
      transactionAmount: 2300,
      myShare: 1150,
      otherPartyEmail: "partner@auraxis.dev",
      createdAt: "2026-04-02T10:00:00Z",
      updatedAt: "2026-04-02T10:00:00Z",
    },
  ],
};

export const sharedEntriesWithMeFixture: SharedEntryListResponse = {
  sharedEntries: [
    {
      id: "shared-entry-2",
      ownerId: "friend-1",
      transactionId: "tx-3",
      status: "accepted",
      splitType: "percentage",
      transactionTitle: "Viagem",
      transactionAmount: 4000,
      myShare: 1200,
      otherPartyEmail: "friend@auraxis.dev",
      createdAt: "2026-04-03T14:00:00Z",
      updatedAt: "2026-04-04T08:00:00Z",
    },
  ],
};

export const sharedInvitationListFixture: SharedInvitationListResponse = {
  invitations: [
    {
      id: "invitation-1",
      sharedEntryId: "shared-entry-1",
      fromUserId: "user-1",
      toUserEmail: "partner@auraxis.dev",
      toUserId: null,
      splitValue: 50,
      shareAmount: null,
      message: "Vamos dividir esta conta",
      status: "pending",
      token: "share-token-1",
      expiresAt: "2026-04-09T10:00:00Z",
      createdAt: "2026-04-02T10:00:00Z",
      respondedAt: null,
    },
  ],
};
