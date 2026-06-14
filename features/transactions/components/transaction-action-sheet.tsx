import { type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { TransactionBottomSheet } from "@/features/transactions/components/transaction-bottom-sheet";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";
import {
  formatStatusLabel,
  getInstallmentLabel,
  statusTone,
} from "@/features/transactions/utils/transaction-presentation";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { formatShortDate } from "@/shared/utils/formatters";

export interface TransactionActionSheetProps {
  readonly transaction: TransactionViewModel | null;
  readonly isPaying: boolean;
  readonly isDuplicating: boolean;
  readonly isDeleting: boolean;
  readonly onClose: () => void;
  readonly onMarkPaid: (txId: string) => void;
  readonly onEdit: (txId: string) => void;
  readonly onDuplicate: (txId: string) => void;
  readonly onDelete: (txId: string) => void;
  readonly onShowInstallmentGroup: (installmentGroupId: string) => void;
}

interface ActionSheetHeaderProps {
  readonly transaction: TransactionViewModel;
}

/** Cabeçalho do sheet: título, descrição, valor, status e vencimento. */
function ActionSheetHeader({ transaction }: ActionSheetHeaderProps): ReactElement {
  const installmentLabel = getInstallmentLabel(transaction);
  return (
    <YStack gap="$1">
      <Paragraph fontFamily="$body" fontWeight="$7" fontSize="$6" color="$color">
        {transaction.title}
      </Paragraph>
      {transaction.description ? (
        <Paragraph fontFamily="$body" fontSize="$3" color="$muted">
          {transaction.description}
        </Paragraph>
      ) : null}
      <XStack alignItems="center" gap="$2" marginTop="$1">
        <Paragraph
          fontFamily="$body"
          fontWeight="$7"
          fontSize="$7"
          color={transaction.type === "income" ? "$success" : "$danger"}
        >
          {transaction.type === "income" ? "+" : "-"}
          {transaction.amount}
        </Paragraph>
        <AppBadge tone={statusTone(transaction.status)}>
          {formatStatusLabel(transaction.status)}
        </AppBadge>
      </XStack>
      <Paragraph fontFamily="$body" fontSize="$3" color="$muted">
        Vence {formatShortDate(transaction.dueDate)}
        {installmentLabel ? ` · ${installmentLabel}` : ""}
      </Paragraph>
    </YStack>
  );
}

/**
 * Action sheet das transações: aberto ao tocar numa linha, traz o detalhe
 * e TODAS as ações (Pagar, Editar, Duplicar, ver parcelas, Excluir). É o
 * caminho acessível — cobre o que o swipe faz como atalho.
 */
export function TransactionActionSheet({
  transaction,
  isPaying,
  isDuplicating,
  isDeleting,
  onClose,
  onMarkPaid,
  onEdit,
  onDuplicate,
  onDelete,
  onShowInstallmentGroup,
}: TransactionActionSheetProps): ReactElement {
  const isBusy = isPaying || isDuplicating || isDeleting;
  const installmentGroupId = transaction?.installmentGroupId ?? null;

  return (
    <TransactionBottomSheet
      visible={Boolean(transaction)}
      onClose={onClose}
      testID="transaction-action-sheet"
    >
      {transaction ? (
        <YStack gap="$3">
          <ActionSheetHeader transaction={transaction} />
          {transaction.status !== "paid" ? (
            <AppButton
              glow
              onPress={() => onMarkPaid(transaction.id)}
              disabled={isBusy}
              testID="action-mark-paid"
            >
              {isPaying ? "Pagando..." : "Pagar"}
            </AppButton>
          ) : null}
          <AppButton
            tone="secondary"
            onPress={() => onEdit(transaction.id)}
            disabled={isBusy}
          >
            Editar
          </AppButton>
          <AppButton
            tone="secondary"
            onPress={() => onDuplicate(transaction.id)}
            disabled={isBusy}
          >
            {isDuplicating ? "Duplicando..." : "Duplicar"}
          </AppButton>
          {installmentGroupId ? (
            <AppButton
              tone="secondary"
              onPress={() => {
                onShowInstallmentGroup(installmentGroupId);
                onClose();
              }}
            >
              Ver outras parcelas
            </AppButton>
          ) : null}
          <AppButton
            tone="danger"
            onPress={() => onDelete(transaction.id)}
            disabled={isBusy}
            testID="action-delete"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AppButton>
          <AppButton tone="secondary" onPress={onClose}>
            Fechar
          </AppButton>
        </YStack>
      ) : null}
    </TransactionBottomSheet>
  );
}
