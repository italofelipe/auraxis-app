import { useCallback, useMemo, useState, type ReactElement } from "react";

import { FlashList } from "@shopify/flash-list";
import { RefreshControl } from "react-native";
import { YStack } from "tamagui";

import { queryKeys } from "@/core/query/query-keys";
import {
  DeleteConfirmModal,
  MarkPaidConfirmModal,
} from "@/features/transactions/components/transaction-action-modals";
import { TransactionActionSheet } from "@/features/transactions/components/transaction-action-sheet";
import { TransactionFeedToolbar } from "@/features/transactions/components/transaction-feed-toolbar";
import { TxCard } from "@/features/transactions/components/tx-card";
import {
  useTransactionFeedActions,
  type FeedItemActionHandlers,
} from "@/features/transactions/hooks/use-transaction-feed-actions";
import type { TransactionsFeedController } from "@/features/transactions/hooks/use-transactions-feed-controller";
import type { TransactionFeedItem } from "@/features/transactions/model/transactions-feed";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppQueryState } from "@/shared/components/app-query-state";
import { useListRefresh } from "@/shared/hooks/use-list-refresh";
import { TransactionListSkeleton } from "@/shared/skeletons";

const TRANSACTIONS_REFRESH_KEYS = [
  queryKeys.transactions.list(),
  queryKeys.transactions.summary(),
] as const;

const listContainerStyle = { paddingBottom: 24 } as const;

const extractKey = (item: TransactionFeedItem): string => item.id;

function FeedSeparator(): ReactElement {
  return <YStack height="$2" />;
}

/** Lista do feed em FlashList de `TxCard`, com cabeçalho e estado vazio. */
function FeedList({
  controller,
  header,
  handlers,
}: {
  readonly controller: TransactionsFeedController;
  readonly header: ReactElement;
  readonly handlers: FeedItemActionHandlers;
}): ReactElement {
  const { refreshing, onRefresh } = useListRefresh(TRANSACTIONS_REFRESH_KEYS);

  const renderItem = useCallback(
    ({ item }: { readonly item: TransactionFeedItem }) => (
      <TxCard
        item={item}
        analytic={controller.viewMode === "analitico"}
        onPress={handlers.openActions}
        onMarkPaid={handlers.requestPay}
        onDelete={handlers.requestDelete}
      />
    ),
    [controller.viewMode, handlers],
  );

  const emptyComponent = useMemo(
    (): ReactElement => (
      <AppEmptyState
        illustration="transactions"
        title="Nenhuma transação no filtro atual"
        description="Crie uma nova transação no botão central ou troque o filtro para visualizar movimentos."
      />
    ),
    [],
  );

  return (
    <FlashList
      data={controller.feedItems}
      keyExtractor={extractKey}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyComponent}
      contentContainerStyle={listContainerStyle}
      ItemSeparatorComponent={FeedSeparator}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      testID="transactions-flashlist"
    />
  );
}

/** Props do corpo do feed. */
export interface TransactionFeedProps {
  readonly controller: TransactionsFeedController;
}

/**
 * Corpo do feed de "Transações": estados de query (loading/erro/vazio) + a
 * lista de cards com o action sheet e os modais de pagar/excluir. Preserva
 * TODA a fiação de ações do controller (via `useTransactionFeedActions`):
 * tocar abre o action sheet (pagar/editar/duplicar/excluir/ver parcelas);
 * arrastar revela Pagar/Excluir.
 *
 * @param props Controller do feed.
 * @returns Lista do feed com sheets e modais de ação.
 */
export function TransactionFeed({ controller }: TransactionFeedProps): ReactElement {
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const actions = useTransactionFeedActions(controller);

  const header = (
    <TransactionFeedToolbar
      controller={controller}
      filterOpen={filterOpen}
      setFilterOpen={setFilterOpen}
      exportOpen={exportOpen}
      setExportOpen={setExportOpen}
    />
  );

  return (
    <>
      <AppQueryState
        query={controller.transactionsQuery}
        options={{
          loading: { title: "Carregando transações", description: "Buscando seus lançamentos." },
          empty: {
            title: "Nenhuma transação no filtro atual",
            description: "Troque o filtro ou crie uma nova transação.",
          },
          error: {
            fallbackTitle: "Não foi possível carregar as transações",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.feedItems.length === 0,
        }}
        loadingComponent={
          <YStack gap="$4">
            {header}
            <TransactionListSkeleton rows={5} />
          </YStack>
        }
        emptyComponent={
          <FeedList controller={controller} header={header} handlers={actions.handlers} />
        }
      >
        {() => (
          <FeedList controller={controller} header={header} handlers={actions.handlers} />
        )}
      </AppQueryState>
      <TransactionActionSheet
        transaction={actions.actionTarget}
        isPaying={controller.payingTransactionId !== null}
        isDuplicating={controller.duplicatingTransactionId !== null}
        isDeleting={controller.deletingTransactionId !== null}
        onClose={actions.closeActions}
        onMarkPaid={actions.handlers.requestPay}
        onEdit={actions.handleEdit}
        onDuplicate={actions.handleDuplicate}
        onDelete={actions.handlers.requestDelete}
        onShowInstallmentGroup={actions.handleShowInstallmentGroup}
      />
      <MarkPaidConfirmModal
        target={actions.payTarget}
        isSubmitting={controller.payingTransactionId !== null}
        onConfirm={(txId, paidAt) => {
          void controller.handleMarkPaid(txId, paidAt);
          actions.closePay();
        }}
        onClose={actions.closePay}
      />
      <DeleteConfirmModal
        target={actions.deleteTarget}
        isDeleting={controller.deletingTransactionId !== null}
        onConfirm={(txId, scope) => {
          void controller.handleDelete(txId, scope);
          actions.closeDelete();
        }}
        onClose={actions.closeDelete}
      />
    </>
  );
}
