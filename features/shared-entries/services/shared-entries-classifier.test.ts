import { sharedEntriesClassifier } from "@/features/shared-entries/services/shared-entries-classifier";
import type {
  SharedEntryRecord,
  SharedInvitationRecord,
} from "@/features/shared-entries/contracts";

const buildInvitation = (
  override: Partial<SharedInvitationRecord> = {},
): SharedInvitationRecord => ({
  id: "inv-1",
  sharedEntryId: "se-1",
  fromUserId: "u-1",
  toUserEmail: "x@y.com",
  toUserId: null,
  splitValue: 50,
  shareAmount: null,
  message: null,
  status: "pending",
  token: "tok",
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  createdAt: "2026-04-01T00:00:00Z",
  respondedAt: null,
  ...override,
});

const buildEntry = (override: Partial<SharedEntryRecord> = {}): SharedEntryRecord => ({
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

describe("SharedEntriesClassifier.invitations", () => {
  it("classifica pending vs responded", () => {
    const views = sharedEntriesClassifier.invitations([
      buildInvitation({ status: "pending" }),
      buildInvitation({ status: "accepted" }),
      buildInvitation({ status: "rejected" }),
    ]);
    expect(views.map((v) => v.bucket)).toEqual([
      "pending",
      "responded",
      "responded",
    ]);
  });

  it("marca convite expirado", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const [view] = sharedEntriesClassifier.invitations([
      buildInvitation({ expiresAt: past }),
    ]);
    expect(view.isExpired).toBe(true);
  });

  it("constroi shareLabel via shareAmount quando presente", () => {
    const [view] = sharedEntriesClassifier.invitations([
      buildInvitation({ shareAmount: 1500, splitValue: null }),
    ]);
    expect(view.shareLabel).toContain("R$");
    expect(view.shareLabel).toContain("1.500");
  });

  it("usa percent quando shareAmount nao disponivel", () => {
    const [view] = sharedEntriesClassifier.invitations([
      buildInvitation({ shareAmount: null, splitValue: 30 }),
    ]);
    expect(view.shareLabel).toBe("Sua parte: 30%");
  });
});

describe("SharedEntriesClassifier.entries", () => {
  it("normaliza accepted como active", () => {
    const [view] = sharedEntriesClassifier.entries([buildEntry({ status: "accepted" })]);
    expect(view.bucket).toBe("active");
  });

  it("normaliza revoked como canceled", () => {
    const [view] = sharedEntriesClassifier.entries([buildEntry({ status: "revoked" })]);
    expect(view.bucket).toBe("canceled");
  });

  it("formata amount e myShare em BRL", () => {
    const [view] = sharedEntriesClassifier.entries([buildEntry()]);
    expect(view.amountLabel).toContain("2.000");
    expect(view.myShareLabel).toContain("1.000");
  });

  it("retorna other para status desconhecidos", () => {
    const [view] = sharedEntriesClassifier.entries([
      buildEntry({ status: "weird" as never }),
    ]);
    expect(view.bucket).toBe("other");
  });
});

describe("SharedEntriesClassifier shortcuts", () => {
  it("pending() filtra apenas pendentes nao expirados", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const result = sharedEntriesClassifier.pending([
      buildInvitation({ status: "pending" }),
      buildInvitation({ status: "accepted" }),
      buildInvitation({ status: "pending", expiresAt: past }),
    ]);
    expect(result).toHaveLength(1);
  });

  it("active() filtra apenas ativos", () => {
    const result = sharedEntriesClassifier.active([
      buildEntry({ status: "active" }),
      buildEntry({ status: "completed" }),
      buildEntry({ status: "canceled" }),
    ]);
    expect(result).toHaveLength(1);
  });
});
