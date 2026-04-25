import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { EntryView } from "@/features/shared-entries/services/shared-entries-classifier";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const BUCKET_TONE: Record<EntryView["bucket"], "default" | "primary" | "danger"> = {
  active: "primary",
  completed: "default",
  canceled: "danger",
  other: "default",
};

const BUCKET_LABEL: Record<EntryView["bucket"], string> = {
  active: "Ativo",
  completed: "Concluido",
  canceled: "Cancelado",
  other: "Outro",
};

export interface SharedEntryCardProps {
  readonly entry: EntryView;
  readonly canRevoke: boolean;
  readonly onRevoke?: () => void;
  readonly isRevoking?: boolean;
  readonly testID?: string;
}

/**
 * View-only card for an active or historical shared entry.
 *
 * @param props - Classified entry, owner-permission flag, action handlers.
 * @returns Card with transaction title, amounts, status badge, optional revoke.
 */
export function SharedEntryCard({
  entry,
  canRevoke,
  onRevoke,
  isRevoking = false,
  testID,
}: SharedEntryCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title={entry.transactionTitle ?? "Lancamento compartilhado"}
      description={entry.otherPartyEmail ?? "Sem identificacao do parceiro."}
      testID={testID}
    >
      <YStack gap="$3">
        <XStack gap="$2" flexWrap="wrap">
          <AppBadge tone={BUCKET_TONE[entry.bucket]}>{BUCKET_LABEL[entry.bucket]}</AppBadge>
          <AppBadge tone="default">{entry.splitType}</AppBadge>
        </XStack>
        {entry.amountLabel ? (
          <AppKeyValueRow label="Valor total" value={entry.amountLabel} />
        ) : null}
        {entry.myShareLabel ? (
          <AppKeyValueRow label="Sua parte" value={entry.myShareLabel} />
        ) : null}
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Atualizado em {new Date(entry.updatedAt).toLocaleDateString("pt-BR")}
        </Paragraph>
        {canRevoke && onRevoke ? (
          <AppButton
            tone="secondary"
            onPress={onRevoke}
            disabled={isRevoking}
            testID={testID ? `${testID}-revoke` : undefined}
          >
            {isRevoking ? "Revogando..." : "Revogar compartilhamento"}
          </AppButton>
        ) : null}
      </YStack>
    </AppSurfaceCard>
  );
}
