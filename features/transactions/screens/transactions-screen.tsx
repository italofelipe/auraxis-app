import { useCallback, useMemo, type ReactElement } from "react";

import { FlashList } from "@shopify/flash-list";
import { RefreshControl } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { queryKeys } from "@/core/query/query-keys";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import {
  useTransactionsScreenController,
  type TransactionsScreenController,
  type TransactionsTypeFilter,
  type TransactionViewModel,
} from "@/features/transactions/hooks/use-transactions-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useListRefresh } from "@/shared/hooks/use-list-refresh";
import { TransactionListSkeleton } from "@/shared/skeletons";
import { formatShortDate } from "@/shared/utils/formatters";

const STATUS_TONE: Record<string, "default" | "primary" | "danger"> = {
  paid: "primary",
  pending: "default",
  overdue: "danger",
  cancelled: "default",
  postponed: "default",
};

const FILTER_LABELS: Record<TransactionsTypeFilter, string> = {
  all: "Todas",
  income: "Receitas",
  expense: "Despesas",
};

const FILTER_ORDER: readonly TransactionsTypeFilter[] = ["all", "income", "expense"];

const TRANSACTIONS_REFRESH_KEYS = [
  queryKeys.transactions.list(),
  queryKeys.transactions.summary(),
] as const;

/**
 * Canonical transactions screen composition for the mobile app.
 *
 * @returns List with filters and create/edit/delete actions or active form.
 */
export function TransactionsScreen(): ReactElement {
  const controller = useTransactionsScreenController();

  if (controller.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <TransactionForm
          initialTransaction={
            controller.formMode.kind === "edit"
              ? controller.formMode.transaction
              : null
          }
          isSubmitting={controller.isSubmitting}
          submitError={controller.submitError}
          onSubmit={controller.handleSubmit}
          onCancel={controller.handleCloseForm}
          onDismissError={controller.dismissSubmitError}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable={false}>
      <FilterHeader controller={controller} />
      <YStack flex={1}>
        <TransactionsListCard controller={controller} />
      </YStack>
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: TransactionsScreenController;
}

function FilterHeader({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Transacoes"
      description={`${controller.total} registradas`}
    >
      <YStack gap="$3">
        <XStack gap="$2" flexWrap="wrap">
          {FILTER_ORDER.map((filter) => (
            <AppButton
              key={filter}
              tone={controller.typeFilter === filter ? "primary" : "secondary"}
              onPress={() => controller.setTypeFilter(filter)}
            >
              {FILTER_LABELS[filter]}
            </AppButton>
          ))}
        </XStack>
        <AppButton onPress={controller.handleOpenCreate}>Nova transacao</AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function TransactionsListCard({ controller }: ControllerProps): ReactElement {
  const queryStateOptions = useMemo(
    () => ({
      loading: {
        title: "Carregando transacoes",
        description: "Buscando suas movimentacoes.",
      },
      loadingPresentation: "skeleton" as const,
      empty: {
        title: "Nenhuma transacao no filtro atual",
        description: "Crie uma nova transacao ou troque o filtro acima.",
      },
      error: {
        fallbackTitle: "Nao foi possivel carregar as transacoes",
        fallbackDescription: "Tente novamente em instantes.",
      },
      isEmpty: () => controller.transactions.length === 0,
    }),
    [controller.transactions.length],
  );

  const emptyComponent = useMemo(
    () => (
      <AppEmptyState
        illustration="transactions"
        title="Nenhuma transacao no filtro atual"
        description="Crie uma nova transacao ou troque o filtro acima para visualizar movimentos."
        cta={{
          label: "Nova transacao",
          onPress: controller.handleOpenCreate,
        }}
      />
    ),
    [controller.handleOpenCreate],
  );

  return (
    <AppQueryState
      query={controller.transactionsQuery}
      options={queryStateOptions}
      loadingComponent={<TransactionListSkeleton rows={5} />}
      emptyComponent={emptyComponent}
    >
      {() => <TransactionsList controller={controller} />}
    </AppQueryState>
  );
}

function TransactionsList({ controller }: ControllerProps): ReactElement {
  const { refreshing, onRefresh } = useListRefresh(TRANSACTIONS_REFRESH_KEYS);

  const handleEdit = useCallback(
    (txId: string): void => {
      const record = controller.transactionsQuery.data?.transactions.find(
        (item) => item.id === txId,
      );
      if (record) {
        controller.handleOpenEdit(record);
      }
    },
    [controller],
  );

  const handleDelete = useCallback(
    (txId: string): void => {
      void controller.handleDelete(txId);
    },
    [controller],
  );

  const renderItem = useCallback(
    ({ item }: { readonly item: TransactionViewModel }) => (
      <TransactionRow
        tx={item}
        isDeleting={controller.deletingTransactionId === item.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [controller.deletingTransactionId, handleDelete, handleEdit],
  );

  return (
    <FlashList
      data={controller.transactions}
      keyExtractor={extractTransactionKey}
      renderItem={renderItem}
      contentContainerStyle={listContainerStyle}
      ItemSeparatorComponent={ListSeparator}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      testID="transactions-flashlist"
    />
  );
}

const extractTransactionKey = (item: TransactionViewModel): string => item.id;

const listContainerStyle = { paddingBottom: 24 } as const;

function ListSeparator(): ReactElement {
  return <YStack height="$2" />;
}

interface TransactionRowProps {
  readonly tx: TransactionViewModel;
  readonly isDeleting: boolean;
  readonly onEdit: (txId: string) => void;
  readonly onDelete: (txId: string) => void;
}

const TransactionRow = function TransactionRow({
  tx,
  isDeleting,
  onEdit,
  onDelete,
}: TransactionRowProps): ReactElement {
  const handleEdit = useCallback(() => {
    onEdit(tx.id);
  }, [onEdit, tx.id]);

  const handleDelete = useCallback(() => {
    onDelete(tx.id);
  }, [onDelete, tx.id]);

  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={tx.title}
        value={
          <XStack alignItems="center" gap="$2">
            <YStack alignItems="flex-end" gap="$1">
              <Paragraph
                color={tx.type === "income" ? "$success" : "$danger"}
                fontFamily="$body"
                fontSize="$4"
              >
                {tx.type === "income" ? "+" : "-"}
                {tx.amount}
              </Paragraph>
              <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                {formatShortDate(tx.dueDate)}
              </Paragraph>
            </YStack>
            <AppBadge tone={STATUS_TONE[tx.status] ?? "default"}>{tx.status}</AppBadge>
          </XStack>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={handleEdit} disabled={isDeleting}>
          Editar
        </AppButton>
        <AppButton tone="secondary" onPress={handleDelete} disabled={isDeleting}>
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
};
