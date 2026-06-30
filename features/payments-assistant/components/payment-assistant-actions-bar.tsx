import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { useT } from "@/shared/i18n";

/** Props for the assistant's primary action buttons. */
export interface PaymentAssistantActionsBarProps {
  readonly payLabel: string;
  readonly onPay: () => void;
  readonly onDelete: () => void;
  readonly onSkip: () => void;
}

/**
 * Accessible button row mirroring the swipe gestures (pay / delete / skip).
 *
 * @param props Pay label and the three handlers.
 * @returns The stacked action buttons.
 */
export function PaymentAssistantActionsBar({
  payLabel,
  onPay,
  onDelete,
  onSkip,
}: PaymentAssistantActionsBarProps): ReactElement {
  const { t } = useT();
  return (
    <YStack gap="$2">
      <AppButton tone="primary" fullWidth onPress={onPay}>
        {payLabel}
      </AppButton>
      <AppButton tone="danger" fullWidth onPress={onDelete}>
        {t("paymentsAssistant.actions.delete")}
      </AppButton>
      <AppButton tone="secondary" fullWidth onPress={onSkip}>
        {t("paymentsAssistant.actions.skip")}
      </AppButton>
    </YStack>
  );
}
