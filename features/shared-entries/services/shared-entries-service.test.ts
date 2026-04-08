import type { AxiosInstance } from "axios";

import { createSharedEntriesService } from "@/features/shared-entries/services/shared-entries-service";

const createClient = (): jest.Mocked<
  Pick<AxiosInstance, "get" | "post" | "delete">
> => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  };
};

describe("sharedEntriesService", () => {
  it("lista compartilhamentos criados por mim e comigo", async () => {
    const client = createClient();
    client.get
      .mockResolvedValueOnce({
        data: {
          data: {
            shared_entries: [
              {
                id: "share-1",
                owner_id: "usr-1",
                transaction_id: "txn-1",
                status: "active",
                split_type: "equal",
                transaction_title: "Mercado",
                transaction_amount: 240.5,
                my_share: 120.25,
                other_party_email: "ana@auraxis.dev",
                created_at: "2026-04-01T10:00:00",
                updated_at: "2026-04-01T10:00:00",
              },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            shared_entries: [
              {
                id: "share-2",
                owner_id: "usr-2",
                transaction_id: "txn-2",
                status: "accepted",
                split_type: "percentage",
                transaction_title: "Streaming",
                transaction_amount: 60,
                my_share: 30,
                other_party_email: "italo@auraxis.dev",
                created_at: "2026-04-02T10:00:00",
                updated_at: "2026-04-02T10:00:00",
              },
            ],
          },
        },
      });

    const service = createSharedEntriesService(client as unknown as AxiosInstance);
    const byMe = await service.listByMe();
    const withMe = await service.listWithMe();

    expect(client.get).toHaveBeenNthCalledWith(1, "/shared-entries/by-me");
    expect(client.get).toHaveBeenNthCalledWith(2, "/shared-entries/with-me");
    expect(byMe.sharedEntries[0]).toEqual(
      expect.objectContaining({
        id: "share-1",
        ownerId: "usr-1",
        splitType: "equal",
      }),
    );
    expect(withMe.sharedEntries[0]).toEqual(
      expect.objectContaining({
        id: "share-2",
        status: "accepted",
        splitType: "percentage",
      }),
    );
  });

  it("cria e remove compartilhamentos", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: {
          shared_entry: {
            id: "share-3",
            owner_id: "usr-1",
            transaction_id: "txn-3",
            status: "active",
            split_type: "custom",
            transaction_title: "Viagem",
            transaction_amount: 900,
            my_share: 450,
            other_party_email: "bia@auraxis.dev",
            created_at: "2026-04-03T10:00:00",
            updated_at: "2026-04-03T10:00:00",
          },
        },
      },
    });
    client.delete.mockResolvedValue({
      data: {
        data: {
          shared_entry: {
            id: "share-3",
            owner_id: "usr-1",
            transaction_id: "txn-3",
            status: "revoked",
            split_type: "custom",
            transaction_title: "Viagem",
            transaction_amount: 900,
            my_share: 450,
            other_party_email: "bia@auraxis.dev",
            created_at: "2026-04-03T10:00:00",
            updated_at: "2026-04-04T10:00:00",
          },
        },
      },
    });

    const service = createSharedEntriesService(client as unknown as AxiosInstance);
    const created = await service.createSharedEntry({
      transactionId: "txn-3",
      splitType: "custom",
    });
    const deleted = await service.deleteSharedEntry("share-3");

    expect(client.post).toHaveBeenCalledWith("/shared-entries", {
      transaction_id: "txn-3",
      split_type: "custom",
    });
    expect(client.delete).toHaveBeenCalledWith("/shared-entries/share-3");
    expect(created.status).toBe("active");
    expect(deleted.status).toBe("revoked");
  });

  it("lista, cria, aceita e remove convites", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          invitations: [
            {
              id: "inv-1",
              shared_entry_id: "share-1",
              from_user_id: "usr-1",
              to_user_email: "ana@auraxis.dev",
              to_user_id: null,
              split_value: 50,
              share_amount: 120.25,
              message: "Vamos dividir",
              status: "pending",
              token: "token-abc",
              expires_at: "2026-04-10T10:00:00",
              created_at: "2026-04-03T10:00:00",
              responded_at: null,
            },
          ],
        },
      },
    });
    client.post
      .mockResolvedValueOnce({
        data: {
          data: {
            invitation: {
              id: "inv-2",
              shared_entry_id: "share-1",
              from_user_id: "usr-1",
              to_user_email: "bia@auraxis.dev",
              to_user_id: null,
              split_value: 50,
              share_amount: 120.25,
              message: "Topa?",
              status: "pending",
              token: "token-def",
              expires_at: "2026-04-11T10:00:00",
              created_at: "2026-04-03T10:00:00",
              responded_at: null,
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            invitation: {
              id: "inv-2",
              shared_entry_id: "share-1",
              from_user_id: "usr-1",
              to_user_email: "bia@auraxis.dev",
              to_user_id: "usr-2",
              split_value: 50,
              share_amount: 120.25,
              message: "Topa?",
              status: "accepted",
              token: "token-def",
              expires_at: "2026-04-11T10:00:00",
              created_at: "2026-04-03T10:00:00",
              responded_at: "2026-04-03T12:00:00",
            },
          },
        },
      });
    client.delete.mockResolvedValue({
      data: {
        data: {
          invitation: {
            id: "inv-2",
            shared_entry_id: "share-1",
            from_user_id: "usr-1",
            to_user_email: "bia@auraxis.dev",
            to_user_id: null,
            split_value: 50,
            share_amount: 120.25,
            message: "Topa?",
            status: "revoked",
            token: "token-def",
            expires_at: "2026-04-11T10:00:00",
            created_at: "2026-04-03T10:00:00",
            responded_at: null,
          },
        },
      },
    });

    const service = createSharedEntriesService(client as unknown as AxiosInstance);
    const invitations = await service.listInvitations();
    const created = await service.createInvitation({
      sharedEntryId: "share-1",
      inviteeEmail: "bia@auraxis.dev",
      splitValue: 50,
      shareAmount: 120.25,
      message: "Topa?",
      expiresInHours: 48,
    });
    const accepted = await service.acceptInvitation("token-def");
    const deleted = await service.deleteInvitation("inv-2");

    expect(client.get).toHaveBeenCalledWith("/shared-entries/invitations");
    expect(client.post).toHaveBeenNthCalledWith(1, "/shared-entries/invitations", {
      shared_entry_id: "share-1",
      invitee_email: "bia@auraxis.dev",
      split_value: 50,
      share_amount: 120.25,
      message: "Topa?",
      expires_in_hours: 48,
    });
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      "/shared-entries/invitations/token-def/accept",
    );
    expect(client.delete).toHaveBeenCalledWith("/shared-entries/invitations/inv-2");
    expect(invitations.invitations[0]?.status).toBe("pending");
    expect(created.status).toBe("pending");
    expect(accepted.status).toBe("accepted");
    expect(deleted.status).toBe("revoked");
  });
});
