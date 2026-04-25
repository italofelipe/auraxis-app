import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { InvitationView } from "@/features/shared-entries/services/shared-entries-classifier";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export interface SharedInvitationCardProps {
  readonly invitation: InvitationView;
  readonly onAccept: () => void;
  readonly onReject: () => void;
  readonly isPending: boolean;
  readonly testID?: string;
}

/**
 * View-only card for a pending shared-entry invitation.
 *
 * @param props - Classified invitation, action handlers and pending flag.
 * @returns Card with sender, share label and accept/reject buttons.
 */
export function SharedInvitationCard({
  invitation,
  onAccept,
  onReject,
  isPending,
  testID,
}: SharedInvitationCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title={invitation.toUserEmail}
      description={invitation.message ?? "Convite para dividir uma despesa."}
      testID={testID}
    >
      <YStack gap="$3">
        <XStack gap="$2" alignItems="center" flexWrap="wrap">
          {invitation.shareLabel ? (
            <AppBadge tone="primary">{invitation.shareLabel}</AppBadge>
          ) : null}
          {invitation.isExpired ? <AppBadge tone="danger">Expirado</AppBadge> : null}
        </XStack>
        {invitation.expiresAt ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            Expira em {new Date(invitation.expiresAt).toLocaleString("pt-BR")}
          </Paragraph>
        ) : null}
        <XStack gap="$2" flexWrap="wrap">
          <AppButton
            onPress={onAccept}
            disabled={isPending || invitation.isExpired}
            testID={testID ? `${testID}-accept` : undefined}
          >
            Aceitar
          </AppButton>
          <AppButton
            tone="secondary"
            onPress={onReject}
            disabled={isPending}
            testID={testID ? `${testID}-reject` : undefined}
          >
            Recusar
          </AppButton>
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}
