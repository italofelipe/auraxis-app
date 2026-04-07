import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { AlertRecord } from "@/features/alerts/contracts";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatShortDate } from "@/shared/utils/formatters";

export interface AlertRecordCardProps {
  readonly alert: AlertRecord;
  readonly onMarkRead: (alertId: string) => void;
  readonly onDelete: (alertId: string) => void;
}

/**
 * Canonical product card for an alert record.
 *
 * @param props Alert data and mutation handlers injected by the screen controller.
 * @returns A product-facing alert card with semantic actions.
 */
export function AlertRecordCard({
  alert,
  onMarkRead,
  onDelete,
}: AlertRecordCardProps): ReactElement {
  const isRead = alert.status === "read";

  return (
    <AppSurfaceCard
      title={alert.category.replace(/_/gu, " ")}
      description={
        alert.entityType
          ? `Evento relacionado a ${alert.entityType}.`
          : "Nova atualizacao operacional disponivel."
      }
      backgroundColor="$surfaceRaised">
      <YStack gap="$3">
        <XStack alignItems="center" justifyContent="space-between" gap="$3" flexWrap="wrap">
          <AppBadge tone={isRead ? "default" : "primary"}>
            {isRead ? "lido" : "novo"}
          </AppBadge>
          {alert.triggeredAt ? (
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              {formatShortDate(alert.triggeredAt)}
            </Paragraph>
          ) : null}
        </XStack>

        {alert.entityId ? (
          <AppKeyValueRow label="Referencia" value={alert.entityId} />
        ) : null}

        <XStack gap="$2" flexWrap="wrap">
          {!isRead ? (
            <AppButton
              tone="secondary"
              onPress={() => {
                onMarkRead(alert.id);
              }}>
              Marcar lido
            </AppButton>
          ) : null}
          <AppButton
            tone="secondary"
            onPress={() => {
              onDelete(alert.id);
            }}>
            Excluir
          </AppButton>
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}
