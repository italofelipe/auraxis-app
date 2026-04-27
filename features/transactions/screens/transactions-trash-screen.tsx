import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { DeletedTransactionRecord } from "@/features/transactions/contracts";
import {
  useTransactionsTrashScreenController,
  type TransactionsTrashScreenController,
} from "@/features/transactions/hooks/use-transactions-trash-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const formatDate = (value: string | null): string => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
};

export function TransactionsTrashScreen(): ReactElement {
  const controller = useTransactionsTrashScreenController();
  return (
    <AppScreen>
      <AppSurfaceCard
        title="Lixeira de transacoes"
        description="Restaure transacoes excluidas recentemente."
      >
        <AppQueryState
          query={controller.deletedQuery}
          options={{
            loading: {
              title: "Carregando lixeira",
              description: "Buscando transacoes excluidas.",
            },
            empty: {
              title: "Nenhuma transacao excluida",
              description: "A lixeira esta vazia.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar a lixeira",
              fallbackDescription: "Tente novamente em instantes.",
            },
            isEmpty: () => controller.transactions.length === 0,
          }}
        >
          {() => <DeletedList controller={controller} />}
        </AppQueryState>
        {controller.restoreError ? (
          <AppErrorNotice
            error={controller.restoreError}
            fallbackTitle="Nao foi possivel restaurar"
            fallbackDescription="Tente novamente em instantes."
            secondaryActionLabel="Fechar"
            onSecondaryAction={controller.dismissRestoreError}
          />
        ) : null}
      </AppSurfaceCard>
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: TransactionsTrashScreenController;
}

function DeletedList({ controller }: ControllerProps): ReactElement {
  return (
    <YStack gap="$3">
      {controller.transactions.map((transaction) => (
        <DeletedRow
          key={transaction.id}
          transaction={transaction}
          isRestoring={controller.restoringTransactionId === transaction.id}
          onRestore={() => {
            void controller.handleRestore(transaction.id);
          }}
        />
      ))}
    </YStack>
  );
}

interface DeletedRowProps {
  readonly transaction: DeletedTransactionRecord;
  readonly isRestoring: boolean;
  readonly onRestore: () => void;
}

function DeletedRow({
  transaction,
  isRestoring,
  onRestore,
}: DeletedRowProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={transaction.title}
        value={
          <YStack alignItems="flex-end" gap="$1">
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              {transaction.amount}
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              Excluida em {formatDate(transaction.deletedAt)}
            </Paragraph>
          </YStack>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={onRestore} disabled={isRestoring}>
          {isRestoring ? "Restaurando..." : "Restaurar"}
        </AppButton>
      </XStack>
    </YStack>
  );
}
