import { type ReactElement, useCallback } from "react";

import { Alert, Modal, Pressable } from "react-native";
import { YStack } from "tamagui";

import { usePaymentAssistantController } from "@/features/payments-assistant/hooks/use-payment-assistant-controller";
import { PaymentAssistantFooter } from "@/features/payments-assistant/components/payment-assistant-footer";
import {
  PaymentAssistantActiveSection,
  PaymentAssistantDoneState,
} from "@/features/payments-assistant/components/payment-assistant-sections";
import { AppText } from "@/shared/components/app-text";
import { useT } from "@/shared/i18n";

/** Backdrop kept in a variable (parity with existing sheets), 100% OTA. */
const BACKDROP = "rgba(0,0,0,0.55)";
const SHEET_RADIUS = 24;

/**
 * Host for the Payments Assistant on mobile.
 *
 * Self-triggers (1×/session, Premium) and presents a bottom-sheet `Modal` with a
 * Tinder-style swipe deck: swipe right / tap to mark paid-received, swipe left /
 * tap to delete (confirmed), skip, mark-all, and undo. "Mark paid" only updates
 * Auraxis status — no real money moves.
 *
 * @returns The modal, or null while hidden.
 */
export function PaymentAssistantHost(): ReactElement | null {
  const { t } = useT();
  const controller = usePaymentAssistantController();

  const canUndo =
    controller.lastAction?.kind === "paid" || controller.lastAction?.kind === "deleted";
  const payLabel =
    controller.current?.type === "income"
      ? t("paymentsAssistant.actions.payIncome")
      : t("paymentsAssistant.actions.payExpense");

  const confirmDelete = useCallback((): void => {
    Alert.alert(
      t("paymentsAssistant.confirmDeleteTitle"),
      t("paymentsAssistant.confirmDelete"),
      [
        { text: t("paymentsAssistant.actions.cancel"), style: "cancel" },
        {
          text: t("paymentsAssistant.actions.delete"),
          style: "destructive",
          onPress: (): void => {
            void controller.discard();
          },
        },
      ],
    );
  }, [controller, t]);

  if (!controller.isVisible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={controller.close}>
      <Pressable
        style={{ flex: 1 }}
        accessibilityRole="button"
        accessibilityLabel={t("paymentsAssistant.actions.close")}
        onPress={controller.close}
      >
        <YStack flex={1} backgroundColor={BACKDROP} justifyContent="flex-end">
          <Pressable>
            <YStack
              testID="payment-assistant-host"
              backgroundColor="$background"
              padding="$4"
              paddingBottom="$6"
              gap="$3"
              borderTopLeftRadius={SHEET_RADIUS}
              borderTopRightRadius={SHEET_RADIUS}
            >
              <AppText size="bodyLg" tone="default">
                {t("paymentsAssistant.title")}
              </AppText>

              {!controller.isDone && controller.current ? (
                <PaymentAssistantActiveSection
                  controller={controller}
                  payLabel={payLabel}
                  onDelete={confirmDelete}
                />
              ) : (
                <PaymentAssistantDoneState />
              )}

              <PaymentAssistantFooter
                canUndo={canUndo}
                showMarkAll={!controller.isDone && controller.progress.total > 1}
                onUndo={(): void => {
                  void controller.undo();
                }}
                onMarkAll={(): void => {
                  void controller.markAllPaid();
                }}
                onClose={controller.close}
              />
            </YStack>
          </Pressable>
        </YStack>
      </Pressable>
    </Modal>
  );
}
