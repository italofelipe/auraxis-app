import type {
  SharedEntryRecord,
  SharedInvitationRecord,
} from "@/features/shared-entries/contracts";

export type InvitationBucket = "pending" | "responded";
export type EntryBucket = "active" | "completed" | "canceled" | "other";

export interface InvitationView extends SharedInvitationRecord {
  readonly bucket: InvitationBucket;
  readonly isExpired: boolean;
  readonly shareLabel: string | null;
}

export interface EntryView extends SharedEntryRecord {
  readonly bucket: EntryBucket;
  readonly amountLabel: string | null;
  readonly myShareLabel: string | null;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatBrl = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return currencyFormatter.format(value);
};

const formatPercent = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return `${value.toFixed(0)}%`;
};

const classifyInvitationBucket = (
  invitation: SharedInvitationRecord,
): InvitationBucket => {
  return invitation.status === "pending" ? "pending" : "responded";
};

const classifyEntryBucket = (entry: SharedEntryRecord): EntryBucket => {
  if (entry.status === "active" || entry.status === "accepted") {
    return "active";
  }
  if (entry.status === "completed") {
    return "completed";
  }
  if (entry.status === "canceled" || entry.status === "revoked") {
    return "canceled";
  }
  return "other";
};

const isInvitationExpired = (invitation: SharedInvitationRecord): boolean => {
  if (!invitation.expiresAt) {
    return false;
  }
  return new Date(invitation.expiresAt).getTime() < Date.now();
};

const buildShareLabel = (invitation: SharedInvitationRecord): string | null => {
  const amount = formatBrl(invitation.shareAmount);
  if (amount) {
    return `Sua parte: ${amount}`;
  }
  const percent = formatPercent(invitation.splitValue);
  if (percent) {
    return `Sua parte: ${percent}`;
  }
  return null;
};

/**
 * Pure projection layer for shared entries and shared invitations.
 *
 * The classifier runs in plain TS (no React) so the same buckets and
 * derived labels can be reused across screens and tests.
 */
export class SharedEntriesClassifier {
  // eslint-disable-next-line class-methods-use-this
  invitations(records: readonly SharedInvitationRecord[]): readonly InvitationView[] {
    return records.map((invitation) => ({
      ...invitation,
      bucket: classifyInvitationBucket(invitation),
      isExpired: isInvitationExpired(invitation),
      shareLabel: buildShareLabel(invitation),
    }));
  }

  // eslint-disable-next-line class-methods-use-this
  entries(records: readonly SharedEntryRecord[]): readonly EntryView[] {
    return records.map((entry) => ({
      ...entry,
      bucket: classifyEntryBucket(entry),
      amountLabel: formatBrl(entry.transactionAmount),
      myShareLabel: formatBrl(entry.myShare),
    }));
  }

  pending(records: readonly SharedInvitationRecord[]): readonly InvitationView[] {
    return this.invitations(records).filter((invitation) => {
      return invitation.bucket === "pending" && !invitation.isExpired;
    });
  }

  active(records: readonly SharedEntryRecord[]): readonly EntryView[] {
    return this.entries(records).filter((entry) => entry.bucket === "active");
  }
}

export const sharedEntriesClassifier = new SharedEntriesClassifier();
