import { useCallback, useMemo, type ReactElement } from "react";

import { FlashList } from "@shopify/flash-list";
import { RefreshControl } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { queryKeys } from "@/core/query/query-keys";
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
import { useListRefresh } from "@/shared/hooks/use-list-refresh";
import { TransactionListSkeleton } from "@/shared/skeletons";

const TRASH_REFRESH_KEYS = [queryKeys.transactions.deleted()] as const;

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

const extractKey = (item: DeletedTransactionRecord): string => item.id;

const listContainerStyle = { paddingBottom: 16 } as const;

function ListSeparator(): ReactElement {
  return <YStack height="$2" />;
}

export function TransactionsTrashScreen(): ReactElement {
  const controller = useTransactionsTrashScreenController();
  const queryStateOptions = useMemo(
    () => ({
      loading: {
        title: "Carregando lixeira",
        description: "Buscando transacoes excluidas.",
      },
      loadingPresentation: "skeleton" as const,
      empty: {
        title: "Nenhuma transacao excluida",
        description: "A lixeira esta vazia.",
      },
      error: {
        fallbackTitle: "Nao foi possivel carregar a lixeira",
        fallbackDescription: "Tente novamente em instantes.",
      },
      isEmpty: () => controller.transactions.length === 0,
    }),
    [controller.transactions.length],
  );

  return (
    <AppScreen scrollable={false}>
      <AppSurfaceCard
        title="Lixeira de transacoes"
        description="Restaure transacoes excluidas recentemente."
      >
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
      <YStack flex={1}>
        <AppQueryState
          query={controller.deletedQuery}
          options={queryStateOptions}
          loadingComponent={<TransactionListSkeleton rows={4} />}
        >
          {() => <DeletedList controller={controller} />}
        </AppQueryState>
      </YStack>
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: TransactionsTrashScreenController;
}

function DeletedList({ controller }: ControllerProps): ReactElement {
  const { refreshing, onRefresh } = useListRefresh(TRASH_REFRESH_KEYS);

  const handleRestore = useCallback(
    (txId: string): void => {
      void controller.handleRestore(txId);
    },
    [controller],
  );

  const renderItem = useCallback(
    ({ item }: { readonly item: DeletedTransactionRecord }) => (
      <DeletedRow
        transaction={item}
        isRestoring={controller.restoringTransactionId === item.id}
        onRestore={handleRestore}
      />
    ),
    [controller.restoringTransactionId, handleRestore],
  );

  return (
    <FlashList
      data={controller.transactions}
      keyExtractor={extractKey}
      renderItem={renderItem}
      contentContainerStyle={listContainerStyle}
      ItemSeparatorComponent={ListSeparator}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      testID="transactions-trash-flashlist"
    />
  );
}

interface DeletedRowProps {
  readonly transaction: DeletedTransactionRecord;
  readonly isRestoring: boolean;
  readonly onRestore: (txId: string) => void;
}

const DeletedRow = function DeletedRow({
  transaction,
  isRestoring,
  onRestore,
}: DeletedRowProps): ReactElement {
  const handlePress = useCallback(() => {
    onRestore(transaction.id);
  }, [onRestore, transaction.id]);

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
        <AppButton tone="secondary" onPress={handlePress} disabled={isRestoring}>
          {isRestoring ? "Restaurando..." : "Restaurar"}
        </AppButton>
      </XStack>
    </YStack>
  );
};
