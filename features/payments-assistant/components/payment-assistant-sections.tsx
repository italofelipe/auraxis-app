import type { ReactElement } from "react";

import { YStack } from "tamagui";

import type { PaymentAssistantController } from "@/features/payments-assistant/hooks/use-payment-assistant-controller";
import { PaymentAssistantActionsBar } from "@/features/payments-assistant/components/payment-assistant-actions-bar";
import { PaymentAssistantDeck } from "@/features/payments-assistant/components/payment-assistant-deck";
import { AppText } from "@/shared/components/app-text";
import { useT } from "@/shared/i18n";

/** Props for the active (reviewing) section. */
export interface PaymentAssistantActiveSectionProps {
  readonly controller: PaymentAssistantController;
  readonly payLabel: string;
  readonly onDelete: () => void;
}

/**
 * The reviewing section: progress, the swipe deck, the status hint and the
 * accessible action buttons.
 *
 * @param props Controller, pay label and the (confirmed) delete handler.
 * @returns The active section.
 */
export function PaymentAssistantActiveSection({
  controller,
  payLabel,
  onDelete,
}: PaymentAssistantActiveSectionProps): ReactElement {
  const { t } = useT();
  return (
    <YStack gap="$3">
      <AppText size="caption" tone="muted">
        {t("paymentsAssistant.progress", {
          current: controller.progress.current,
          total: controller.progress.total,
        })}
      </AppText>
      <PaymentAssistantDeck
        card={controller.current}
        onPay={(): void => {
          void controller.pay();
        }}
        onDelete={onDelete}
      />
      <AppText size="caption" tone="muted">
        {t("paymentsAssistant.statusHint")}
      </AppText>
      <PaymentAssistantActionsBar
        payLabel={payLabel}
        onPay={(): void => {
          void controller.pay();
        }}
        onDelete={onDelete}
        onSkip={controller.skipCard}
      />
    </YStack>
  );
}

/**
 * The done / empty state shown when there is no overdue backlog left.
 *
 * @returns The done state.
 */
export function PaymentAssistantDoneState(): ReactElement {
  const { t } = useT();
  return (
    <YStack gap="$2" paddingVertical="$4" alignItems="center">
      <AppText size="bodyLg" tone="default">
        {t("paymentsAssistant.emptyTitle")}
      </AppText>
      <AppText size="bodySm" tone="muted">
        {t("paymentsAssistant.emptyBody")}
      </AppText>
    </YStack>
  );
}
