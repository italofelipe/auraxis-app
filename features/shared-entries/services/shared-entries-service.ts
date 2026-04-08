import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  CreateSharedEntryCommand,
  CreateSharedInvitationCommand,
  SharedEntryListResponse,
  SharedEntryRecord,
  SharedInvitationListResponse,
  SharedInvitationRecord,
} from "@/features/shared-entries/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface SharedEntryPayload {
  readonly id: string;
  readonly owner_id: string;
  readonly transaction_id: string;
  readonly status: string;
  readonly split_type: SharedEntryRecord["splitType"];
  readonly transaction_title: string | null;
  readonly transaction_amount: number | null;
  readonly my_share: number | null;
  readonly other_party_email: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

interface SharedInvitationPayload {
  readonly id: string;
  readonly shared_entry_id: string;
  readonly from_user_id: string;
  readonly to_user_email: string;
  readonly to_user_id: string | null;
  readonly split_value: number | null;
  readonly share_amount: number | null;
  readonly message: string | null;
  readonly status: string;
  readonly token: string | null;
  readonly expires_at: string | null;
  readonly created_at: string;
  readonly responded_at: string | null;
}

const mapSharedEntry = (payload: SharedEntryPayload): SharedEntryRecord => {
  return {
    id: payload.id,
    ownerId: payload.owner_id,
    transactionId: payload.transaction_id,
    status: payload.status,
    splitType: payload.split_type,
    transactionTitle: payload.transaction_title,
    transactionAmount: payload.transaction_amount,
    myShare: payload.my_share,
    otherPartyEmail: payload.other_party_email,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  };
};

const mapInvitation = (
  payload: SharedInvitationPayload,
): SharedInvitationRecord => {
  return {
    id: payload.id,
    sharedEntryId: payload.shared_entry_id,
    fromUserId: payload.from_user_id,
    toUserEmail: payload.to_user_email,
    toUserId: payload.to_user_id,
    splitValue: payload.split_value,
    shareAmount: payload.share_amount,
    message: payload.message,
    status: payload.status,
    token: payload.token,
    expiresAt: payload.expires_at,
    createdAt: payload.created_at,
    respondedAt: payload.responded_at,
  };
};

export const createSharedEntriesService = (client: AxiosInstance) => {
  return {
    listByMe: async (): Promise<SharedEntryListResponse> => {
      const response = await client.get(apiContractMap.sharedEntriesByMe.path);
      const payload = unwrapEnvelopeData<{
        readonly shared_entries: SharedEntryPayload[];
      }>(response.data);
      return {
        sharedEntries: payload.shared_entries.map(mapSharedEntry),
      };
    },
    listWithMe: async (): Promise<SharedEntryListResponse> => {
      const response = await client.get(apiContractMap.sharedEntriesWithMe.path);
      const payload = unwrapEnvelopeData<{
        readonly shared_entries: SharedEntryPayload[];
      }>(response.data);
      return {
        sharedEntries: payload.shared_entries.map(mapSharedEntry),
      };
    },
    createSharedEntry: async (
      command: CreateSharedEntryCommand,
    ): Promise<SharedEntryRecord> => {
      const response = await client.post(apiContractMap.sharedEntriesCreate.path, {
        transaction_id: command.transactionId,
        split_type: command.splitType,
      });
      const payload = unwrapEnvelopeData<{ readonly shared_entry: SharedEntryPayload }>(
        response.data,
      );
      return mapSharedEntry(payload.shared_entry);
    },
    deleteSharedEntry: async (sharedEntryId: string): Promise<SharedEntryRecord> => {
      const response = await client.delete(
        resolveApiContractPath(apiContractMap.sharedEntriesDelete.path, {
          sharedEntryId,
        }),
      );
      const payload = unwrapEnvelopeData<{ readonly shared_entry: SharedEntryPayload }>(
        response.data,
      );
      return mapSharedEntry(payload.shared_entry);
    },
    listInvitations: async (): Promise<SharedInvitationListResponse> => {
      const response = await client.get(apiContractMap.sharedInvitationsList.path);
      const payload = unwrapEnvelopeData<{
        readonly invitations: SharedInvitationPayload[];
      }>(response.data);
      return {
        invitations: payload.invitations.map(mapInvitation),
      };
    },
    createInvitation: async (
      command: CreateSharedInvitationCommand,
    ): Promise<SharedInvitationRecord> => {
      const response = await client.post(apiContractMap.sharedInvitationsCreate.path, {
        shared_entry_id: command.sharedEntryId,
        invitee_email: command.inviteeEmail,
        split_value: command.splitValue,
        share_amount: command.shareAmount,
        message: command.message,
        expires_in_hours: command.expiresInHours,
      });
      const payload = unwrapEnvelopeData<{ readonly invitation: SharedInvitationPayload }>(
        response.data,
      );
      return mapInvitation(payload.invitation);
    },
    acceptInvitation: async (token: string): Promise<SharedInvitationRecord> => {
      const response = await client.post(
        resolveApiContractPath(apiContractMap.sharedInvitationsAccept.path, {
          token,
        }),
      );
      const payload = unwrapEnvelopeData<{ readonly invitation: SharedInvitationPayload }>(
        response.data,
      );
      return mapInvitation(payload.invitation);
    },
    deleteInvitation: async (
      invitationId: string,
    ): Promise<SharedInvitationRecord> => {
      const response = await client.delete(
        resolveApiContractPath(apiContractMap.sharedInvitationsDelete.path, {
          invitationId,
        }),
      );
      const payload = unwrapEnvelopeData<{ readonly invitation: SharedInvitationPayload }>(
        response.data,
      );
      return mapInvitation(payload.invitation);
    },
  };
};

export const sharedEntriesService = createSharedEntriesService(httpClient);
