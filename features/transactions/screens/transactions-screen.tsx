import { useCallback, useMemo, useState, type ReactElement } from "react";

import { FlashList } from "@shopify/flash-list";
import { Modal, RefreshControl } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { queryKeys } from "@/core/query/query-keys";
import { FinancialCalendar } from "@/features/transactions/components/financial-calendar";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { useTransactionsExport } from "@/features/transactions/hooks/use-transactions-export";
import {
  useTransactionsScreenController,
  type TransactionsScreenController,
  type TransactionsTypeFilter,
  type TransactionsViewMode,
  type TransactionViewModel,
} from "@/features/transactions/hooks/use-transactions-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useListRefresh } from "@/shared/hooks/use-list-refresh";
import { useT } from "@/shared/i18n";
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
        {controller.viewMode === "calendar" ? (
          <FinancialCalendar transactions={controller.transactions} />
        ) : (
          <TransactionsListCard controller={controller} />
        )}
      </YStack>
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: TransactionsScreenController;
}

function FilterHeader({ controller }: ControllerProps): ReactElement {
  const { t } = useT();
  const [exportSheetOpen, setExportSheetOpen] = useState<boolean>(false);
  const exportRunner = useTransactionsExport();

  const handleExportFormat = useCallback(
    async (format: "csv" | "pdf"): Promise<void> => {
      await exportRunner.exportNow({ format });
      setExportSheetOpen(false);
    },
    [exportRunner],
  );

  return (
    <AppSurfaceCard
      title="Transacoes"
      description={`${controller.total} registradas`}
    >
      <YStack gap="$3">
        <ViewToggle
          mode={controller.viewMode}
          onChange={controller.setViewMode}
          listLabel={t("transactions.view.list")}
          calendarLabel={t("transactions.view.calendar")}
        />
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
        <XStack gap="$2">
          <AppButton flex={1} onPress={controller.handleOpenCreate}>
            Nova transacao
          </AppButton>
          <AppButton
            flex={1}
            tone="secondary"
            onPress={() => setExportSheetOpen(true)}
          >
            {t("transactions.export.title")}
          </AppButton>
        </XStack>
      </YStack>
      <Modal
        visible={exportSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setExportSheetOpen(false)}
      >
        <ExportSheet
          onClose={() => setExportSheetOpen(false)}
          onExport={handleExportFormat}
          isExporting={exportRunner.isExporting}
          error={exportRunner.error}
          dismissError={exportRunner.dismissError}
          translate={t}
        />
      </Modal>
    </AppSurfaceCard>
  );
}

interface ViewToggleProps {
  readonly mode: TransactionsViewMode;
  readonly onChange: (mode: TransactionsViewMode) => void;
  readonly listLabel: string;
  readonly calendarLabel: string;
}

function ViewToggle({
  mode,
  onChange,
  listLabel,
  calendarLabel,
}: ViewToggleProps): ReactElement {
  return (
    <XStack gap="$2">
      <AppButton
        flex={1}
        tone={mode === "list" ? "primary" : "secondary"}
        onPress={() => onChange("list")}
        accessibilityState={{ selected: mode === "list" }}
      >
        {listLabel}
      </AppButton>
      <AppButton
        flex={1}
        tone={mode === "calendar" ? "primary" : "secondary"}
        onPress={() => onChange("calendar")}
        accessibilityState={{ selected: mode === "calendar" }}
      >
        {calendarLabel}
      </AppButton>
    </XStack>
  );
}

interface ExportSheetProps {
  readonly onClose: () => void;
  readonly onExport: (format: "csv" | "pdf") => Promise<void>;
  readonly isExporting: boolean;
  readonly error: unknown | null;
  readonly dismissError: () => void;
  readonly translate: (key: string) => string;
}

function ExportSheet({
  onClose,
  onExport,
  isExporting,
  error,
  dismissError,
  translate,
}: ExportSheetProps): ReactElement {
  return (
    <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
      <YStack
        backgroundColor="$background"
        padding="$4"
        gap="$3"
        borderTopLeftRadius="$3"
        borderTopRightRadius="$3"
      >
        <AppSurfaceCard
          title={translate("transactions.export.title")}
          description={translate("transactions.export.description")}
        >
          <YStack gap="$3">
            <XStack gap="$2">
              <AppButton
                flex={1}
                onPress={() => {
                  void onExport("csv");
                }}
                disabled={isExporting}
              >
                {translate("transactions.export.csv")}
              </AppButton>
              <AppButton
                flex={1}
                onPress={() => {
                  void onExport("pdf");
                }}
                disabled={isExporting}
              >
                {translate("transactions.export.pdf")}
              </AppButton>
            </XStack>
            {isExporting ? (
              <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                {translate("transactions.export.submitting")}
              </Paragraph>
            ) : null}
            {error ? (
              <AppErrorNotice
                error={error}
                fallbackTitle={translate("transactions.export.errorTitle")}
                fallbackDescription={translate(
                  "transactions.export.errorDescription",
                )}
                secondaryActionLabel="Fechar"
                onSecondaryAction={dismissError}
              />
            ) : null}
            <AppButton tone="secondary" onPress={onClose}>
              Fechar
            </AppButton>
          </YStack>
        </AppSurfaceCard>
      </YStack>
    </YStack>
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

  const handleDuplicate = useCallback(
    (txId: string): void => {
      void controller.handleDuplicate(txId);
    },
    [controller],
  );

  const renderItem = useCallback(
    ({ item }: { readonly item: TransactionViewModel }) => (
      <TransactionRow
        tx={item}
        isDeleting={controller.deletingTransactionId === item.id}
        isDuplicating={controller.duplicatingTransactionId === item.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    ),
    [
      controller.deletingTransactionId,
      controller.duplicatingTransactionId,
      handleDelete,
      handleDuplicate,
      handleEdit,
    ],
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
  readonly isDuplicating: boolean;
  readonly onEdit: (txId: string) => void;
  readonly onDelete: (txId: string) => void;
  readonly onDuplicate: (txId: string) => void;
}

const TransactionRow = function TransactionRow({
  tx,
  isDeleting,
  isDuplicating,
  onEdit,
  onDelete,
  onDuplicate,
}: TransactionRowProps): ReactElement {
  const handleEdit = useCallback(() => {
    onEdit(tx.id);
  }, [onEdit, tx.id]);

  const handleDelete = useCallback(() => {
    onDelete(tx.id);
  }, [onDelete, tx.id]);

  const handleDuplicate = useCallback(() => {
    onDuplicate(tx.id);
  }, [onDuplicate, tx.id]);

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
        <AppButton tone="secondary" onPress={handleEdit} disabled={isDeleting || isDuplicating}>
          Editar
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={handleDuplicate}
          disabled={isDeleting || isDuplicating}
        >
          {isDuplicating ? "Duplicando..." : "Duplicar"}
        </AppButton>
        <AppButton tone="secondary" onPress={handleDelete} disabled={isDeleting || isDuplicating}>
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
};
