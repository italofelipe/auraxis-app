import { useEffect, useState, type ReactElement } from "react";

import { Modal } from "react-native";
import { YStack } from "tamagui";

import type { TransactionDeleteScope } from "@/features/transactions/contracts";
import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in the device timezone formatted as YYYY-MM-DD. */
export const todayLocalIsoDate = (): string => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

interface ActionSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: ReactElement;
}

function ActionSheet({ visible, onClose, children }: ActionSheetProps): ReactElement {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
        <YStack
          backgroundColor="$background"
          padding="$4"
          gap="$3"
          borderTopLeftRadius="$3"
          borderTopRightRadius="$3"
        >
          {children}
        </YStack>
      </YStack>
    </Modal>
  );
}

export interface MarkPaidTarget {
  readonly id: string;
  readonly title: string;
}

export interface MarkPaidConfirmModalProps {
  readonly target: MarkPaidTarget | null;
  readonly isSubmitting: boolean;
  readonly onConfirm: (transactionId: string, paidAt: string) => void;
  readonly onClose: () => void;
}

/**
 * Confirmation sheet for marking a transaction as paid. Asks for the
 * effective payment date (defaults to today) before confirming — mirrors
 * the web pay-confirmation modal.
 */
export function MarkPaidConfirmModal({
  target,
  isSubmitting,
  onConfirm,
  onClose,
}: MarkPaidConfirmModalProps): ReactElement {
  const [paidAt, setPaidAt] = useState<string>(todayLocalIsoDate);
  const targetId = target?.id ?? null;

  useEffect(() => {
    if (targetId) {
      setPaidAt(todayLocalIsoDate());
    }
  }, [targetId]);

  const isDateValid = ISO_DATE_PATTERN.test(paidAt);

  return (
    <ActionSheet visible={Boolean(target)} onClose={onClose}>
      <AppSurfaceCard
        title="Marcar como pago"
        description={target ? `Confirmar pagamento de "${target.title}".` : ""}
      >
        <YStack gap="$3">
          <AppInputField
            id="mark-paid-date"
            label="Data do pagamento"
            value={paidAt}
            onChangeText={setPaidAt}
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            errorText={isDateValid ? undefined : "Use o formato AAAA-MM-DD."}
            testID="mark-paid-date-input"
          />
          <AppButton
            onPress={() => {
              if (target && isDateValid) {
                onConfirm(target.id, paidAt);
              }
            }}
            disabled={isSubmitting || !isDateValid}
            testID="mark-paid-confirm"
          >
            {isSubmitting ? "Confirmando..." : "Confirmar pagamento"}
          </AppButton>
          <AppButton tone="secondary" onPress={onClose} disabled={isSubmitting}>
            Cancelar
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </ActionSheet>
  );
}

export interface DeleteTarget {
  readonly id: string;
  readonly title: string;
  /** True for recurring/installment rows — offers whole-series deletion. */
  readonly isSeries: boolean;
}

export interface DeleteConfirmModalProps {
  readonly target: DeleteTarget | null;
  readonly isDeleting: boolean;
  readonly onConfirm: (transactionId: string, scope: TransactionDeleteScope) => void;
  readonly onClose: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly occurrenceLabel?: string;
  readonly showSeriesOption?: boolean;
}

/**
 * Confirmation sheet for deleting a transaction. For recurring/installment
 * rows it offers deleting only this occurrence or the whole series —
 * mirrors the web delete-confirmation modal.
 */
export function DeleteConfirmModal({
  target,
  isDeleting,
  onConfirm,
  onClose,
  title = "Excluir transacao",
  description,
  occurrenceLabel,
  showSeriesOption = true,
}: DeleteConfirmModalProps): ReactElement {
  const resolvedDescription =
    description ??
    (target
      ? target.isSeries
        ? `"${target.title}" faz parte de uma serie. O que deseja excluir?`
        : `Excluir "${target.title}"? Ela vai para a lixeira.`
      : "");
  const shouldShowSeriesOption = showSeriesOption && target?.isSeries;

  return (
    <ActionSheet visible={Boolean(target)} onClose={onClose}>
      <AppSurfaceCard
        title={title}
        description={resolvedDescription}
      >
        <YStack gap="$3">
          <AppButton
            tone="danger"
            onPress={() => {
              if (target) {
                onConfirm(target.id, "occurrence");
              }
            }}
            disabled={isDeleting}
            testID="delete-occurrence"
          >
            {occurrenceLabel ?? (target?.isSeries ? "Excluir somente esta" : "Excluir")}
          </AppButton>
          {shouldShowSeriesOption ? (
            <AppButton
              tone="danger"
              onPress={() => onConfirm(target.id, "series")}
              disabled={isDeleting}
              testID="delete-series"
            >
              Excluir serie inteira
            </AppButton>
          ) : null}
          <AppButton tone="secondary" onPress={onClose} disabled={isDeleting}>
            Cancelar
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </ActionSheet>
  );
}
