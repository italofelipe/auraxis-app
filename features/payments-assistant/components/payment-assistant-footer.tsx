import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { useT } from "@/shared/i18n";

/** Props for the assistant footer (undo / mark-all / close). */
export interface PaymentAssistantFooterProps {
  readonly canUndo: boolean;
  readonly showMarkAll: boolean;
  readonly onUndo: () => void;
  readonly onMarkAll: () => void;
  readonly onClose: () => void;
}

/**
 * Footer row: undo (when an action can be reverted), mark-all-paid (when there
 * is more than one card) and close.
 *
 * @param props Footer visibility flags and handlers.
 * @returns The footer row.
 */
export function PaymentAssistantFooter({
  canUndo,
  showMarkAll,
  onUndo,
  onMarkAll,
  onClose,
}: PaymentAssistantFooterProps): ReactElement {
  const { t } = useT();
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$2">
      {canUndo ? (
        <AppButton tone="secondary" onPress={onUndo}>
          {t("paymentsAssistant.actions.undo")}
        </AppButton>
      ) : (
        <YStack />
      )}
      <XStack gap="$2">
        {showMarkAll ? (
          <AppButton tone="secondary" onPress={onMarkAll}>
            {t("paymentsAssistant.actions.markAllPaid")}
          </AppButton>
        ) : null}
        <AppButton tone="secondary" onPress={onClose}>
          {t("paymentsAssistant.actions.close")}
        </AppButton>
      </XStack>
    </XStack>
  );
}
