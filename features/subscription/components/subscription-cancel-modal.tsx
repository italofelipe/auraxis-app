import type { ReactElement } from "react";

import { Modal } from "react-native";
import { YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export interface SubscriptionCancelModalProps {
  readonly visible: boolean;
  readonly currentPeriodEnd: string | null;
  readonly isSubmitting: boolean;
  readonly error: unknown | null;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

const formatAccessEnd = (currentPeriodEnd: string | null): string => {
  if (!currentPeriodEnd) {
    return "A API confirmara a data final de acesso depois do cancelamento.";
  }

  return `Seu acesso continua ate ${new Date(currentPeriodEnd).toLocaleDateString(
    "pt-BR",
  )}.`;
};

/**
 * Explicit confirmation for API-managed subscription cancellation.
 */
export function SubscriptionCancelModal({
  visible,
  currentPeriodEnd,
  isSubmitting,
  error,
  onConfirm,
  onClose,
}: SubscriptionCancelModalProps): ReactElement {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isSubmitting ? undefined : onClose}
    >
      <YStack
        flex={1}
        backgroundColor="rgba(0,0,0,0.45)"
        justifyContent="flex-end"
        testID="subscription-cancel-modal"
      >
        <YStack
          backgroundColor="$background"
          padding="$4"
          gap="$3"
          borderTopLeftRadius="$3"
          borderTopRightRadius="$3"
        >
          <AppSurfaceCard
            title="Cancelar assinatura?"
            description={`A renovacao automatica sera interrompida. ${formatAccessEnd(
              currentPeriodEnd,
            )}`}
          >
            <YStack gap="$3">
              {error ? (
                <AppErrorNotice
                  error={error}
                  fallbackTitle="Nao foi possivel cancelar a assinatura"
                  fallbackDescription="A assinatura nao foi alterada. Tente novamente."
                  actionLabel="Tentar novamente"
                  onAction={onConfirm}
                  testID="subscription-cancel-error"
                />
              ) : null}
              {!error ? (
                <AppButton
                  tone="danger"
                  onPress={onConfirm}
                  disabled={isSubmitting}
                  testID="confirm-subscription-cancel"
                >
                  {isSubmitting ? "Cancelando..." : "Confirmar cancelamento"}
                </AppButton>
              ) : null}
              <AppButton
                tone="secondary"
                onPress={onClose}
                disabled={isSubmitting}
                testID="keep-subscription"
              >
                Manter assinatura
              </AppButton>
            </YStack>
          </AppSurfaceCard>
        </YStack>
      </YStack>
    </Modal>
  );
}
