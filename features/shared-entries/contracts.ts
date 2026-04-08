export type SharedEntrySplitType = "equal" | "percentage" | "custom";

export interface SharedEntryRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly transactionId: string;
  readonly status: string;
  readonly splitType: SharedEntrySplitType;
  readonly transactionTitle: string | null;
  readonly transactionAmount: number | null;
  readonly myShare: number | null;
  readonly otherPartyEmail: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SharedEntryListResponse {
  readonly sharedEntries: SharedEntryRecord[];
}

export interface SharedInvitationRecord {
  readonly id: string;
  readonly sharedEntryId: string;
  readonly fromUserId: string;
  readonly toUserEmail: string;
  readonly toUserId: string | null;
  readonly splitValue: number | null;
  readonly shareAmount: number | null;
  readonly message: string | null;
  readonly status: string;
  readonly token: string | null;
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly respondedAt: string | null;
}

export interface SharedInvitationListResponse {
  readonly invitations: SharedInvitationRecord[];
}

export interface CreateSharedEntryCommand {
  readonly transactionId: string;
  readonly splitType: SharedEntrySplitType;
}

export interface CreateSharedInvitationCommand {
  readonly sharedEntryId: string;
  readonly inviteeEmail: string;
  readonly splitValue?: number | null;
  readonly shareAmount?: number | null;
  readonly message?: string | null;
  readonly expiresInHours?: number;
}
