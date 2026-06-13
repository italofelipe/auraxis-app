import { useCallback, useMemo, useState, type ReactElement } from "react";

import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Modal, RefreshControl } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { queryKeys } from "@/core/query/query-keys";
import { IMPORT_FEATURE_FLAG_KEY } from "@/features/import/import-config";
import { AiInsightSurface } from "@/features/insights/components/ai-insight-surface";
import { FinancialCalendar } from "@/features/transactions/components/financial-calendar";
import {
  DeleteConfirmModal,
  MarkPaidConfirmModal,
  type DeleteTarget,
  type MarkPaidTarget,
} from "@/features/transactions/components/transaction-action-modals";
import { TransactionFilters } from "@/features/transactions/components/transaction-filters";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { useTransactionsExport } from "@/features/transactions/hooks/use-transactions-export";
import {
  useTransactionsScreenController,
  type TransactionsScreenController,
  type TransactionsViewMode,
  type TransactionViewModel,
} from "@/features/transactions/hooks/use-transactions-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useListRefresh } from "@/shared/hooks/use-list-refresh";
import { isFeatureEnabled } from "@/shared/feature-flags";
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
  const router = useRouter();

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

  const listHeader = (
    <YStack gap="$4" paddingBottom="$2">
      <FilterHeader controller={controller} />
      <AiInsightSurface
        dimension="transactions"
        onOpenHub={() => router.push(appRoutes.private.insights)}
      />
    </YStack>
  );

  if (controller.viewMode === "calendar") {
    return (
      <AppScreen>
        {listHeader}
        <FinancialCalendar transactions={controller.transactions} />
      </AppScreen>
    );
  }

  // Lista: filtros + insight rolam JUNTO com os itens (ListHeaderComponent),
  // em vez de ficarem fixos comendo a viewport.
  return (
    <AppScreen scrollable={false}>
      <TransactionsListCard controller={controller} listHeader={listHeader} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: TransactionsScreenController;
}

function FilterHeader({ controller }: ControllerProps): ReactElement {
  const { t } = useT();
  const router = useRouter();
  const [exportSheetOpen, setExportSheetOpen] = useState<boolean>(false);
  const exportRunner = useTransactionsExport();
  const importEnabled = isFeatureEnabled(IMPORT_FEATURE_FLAG_KEY);

  const handleExportFormat = useCallback(
    async (format: "csv" | "pdf"): Promise<void> => {
      await exportRunner.exportNow({ format });
      setExportSheetOpen(false);
    },
    [exportRunner],
  );
  const handleOpenImport = useCallback(() => {
    router.push(appRoutes.private.importTransactions);
  }, [router]);

  return (
    <AppSurfaceCard
      title="Transacoes"
      description={`${controller.total} registradas`}
    >
      <FilterHeaderControls
        controller={controller}
        importEnabled={importEnabled}
        listLabel={t("transactions.view.list")}
        calendarLabel={t("transactions.view.calendar")}
        exportLabel={t("transactions.export.title")}
        onOpenExport={() => setExportSheetOpen(true)}
        onOpenImport={handleOpenImport}
      />
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

interface FilterHeaderControlsProps extends ControllerProps {
  readonly importEnabled: boolean;
  readonly listLabel: string;
  readonly calendarLabel: string;
  readonly exportLabel: string;
  readonly onOpenExport: () => void;
  readonly onOpenImport: () => void;
}

function FilterHeaderControls({
  controller,
  importEnabled,
  listLabel,
  calendarLabel,
  exportLabel,
  onOpenExport,
  onOpenImport,
}: FilterHeaderControlsProps): ReactElement {
  return (
    <YStack gap="$3">
      <ViewToggle
        mode={controller.viewMode}
        onChange={controller.setViewMode}
        listLabel={listLabel}
        calendarLabel={calendarLabel}
      />
      <TransactionFilters
        typeFilter={controller.typeFilter}
        onTypeFilterChange={controller.setTypeFilter}
        statusFilter={controller.statusFilter}
        onStatusFilterChange={controller.setStatusFilter}
        tagFilter={controller.tagFilter}
        onTagFilterChange={controller.setTagFilter}
        periodLabel={controller.periodLabel}
        onPreviousMonth={controller.goToPreviousMonth}
        onNextMonth={controller.goToNextMonth}
        onClearFilters={controller.clearFilters}
      />
      <XStack gap="$2">
        <AppButton flex={1} glow onPress={controller.handleOpenCreate}>
          Nova transacao
        </AppButton>
        <AppButton flex={1} tone="secondary" onPress={onOpenExport}>
          {exportLabel}
        </AppButton>
      </XStack>
      {importEnabled ? (
        <AppButton tone="secondary" onPress={onOpenImport}>
          Importar planilha
        </AppButton>
      ) : null}
      <InstallmentGroupFilterNotice controller={controller} />
    </YStack>
  );
}

function InstallmentGroupFilterNotice({
  controller,
}: ControllerProps): ReactElement | null {
  if (!controller.installmentGroupFilter) {
    return null;
  }

  return (
    <XStack alignItems="center" gap="$2">
      <Paragraph color="$muted" flex={1} fontFamily="$body" fontSize="$2">
        Mostrando parcelas da mesma compra.
      </Paragraph>
      <AppButton tone="secondary" onPress={controller.handleClearInstallmentGroupFilter}>
        Mostrar todas
      </AppButton>
    </XStack>
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

interface TransactionsListCardProps extends ControllerProps {
  readonly listHeader: ReactElement;
}

function TransactionsListCard({
  controller,
  listHeader,
}: TransactionsListCardProps): ReactElement {
  const query = controller.transactionsQuery;

  // Estado mostrado pela FlashList quando não há itens (header de filtros
  // sempre visível via ListHeaderComponent, então tudo rola junto).
  const listEmptyComponent = useMemo((): ReactElement => {
    if (query.isPending) {
      return <TransactionListSkeleton rows={5} />;
    }
    if (query.isError) {
      return (
        <AppErrorNotice
          error={query.error}
          fallbackTitle="Nao foi possivel carregar as transacoes"
          fallbackDescription="Tente novamente em instantes."
        />
      );
    }
    return (
      <AppEmptyState
        illustration="transactions"
        title="Nenhuma transacao no filtro atual"
        description="Crie uma nova transacao ou troque o filtro acima para visualizar movimentos."
        cta={{
          label: "Nova transacao",
          onPress: controller.handleOpenCreate,
        }}
      />
    );
  }, [query.isPending, query.isError, query.error, controller.handleOpenCreate]);

  return (
    <TransactionsList
      controller={controller}
      listHeader={listHeader}
      listEmptyComponent={listEmptyComponent}
    />
  );
}

interface TransactionsListProps extends ControllerProps {
  readonly listHeader: ReactElement;
  readonly listEmptyComponent: ReactElement;
}

// eslint-disable-next-line max-lines-per-function
function TransactionsList({
  controller,
  listHeader,
  listEmptyComponent,
}: TransactionsListProps): ReactElement {
  const { refreshing, onRefresh } = useListRefresh(TRANSACTIONS_REFRESH_KEYS);
  const [detailTransactionId, setDetailTransactionId] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<MarkPaidTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const detailTransaction = useMemo(
    () => controller.transactions.find((item) => item.id === detailTransactionId) ?? null,
    [controller.transactions, detailTransactionId],
  );

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
      const tx = controller.transactions.find((item) => item.id === txId);
      if (tx) {
        setDeleteTarget({
          id: tx.id,
          title: tx.title,
          isSeries: tx.isRecurring || tx.isInstallment,
        });
      }
    },
    [controller.transactions],
  );

  const handleMarkPaid = useCallback(
    (txId: string): void => {
      const tx = controller.transactions.find((item) => item.id === txId);
      if (tx) {
        setPayTarget({ id: tx.id, title: tx.title });
      }
    },
    [controller.transactions],
  );

  const handleDuplicate = useCallback(
    (txId: string): void => {
      void controller.handleDuplicate(txId);
    },
    [controller],
  );

  const handleDetails = useCallback((txId: string): void => {
    setDetailTransactionId(txId);
  }, []);

  const handleCloseDetails = useCallback((): void => {
    setDetailTransactionId(null);
  }, []);

  const renderItem = useCallback(
    ({ item }: { readonly item: TransactionViewModel }) => (
      <TransactionRow
        tx={item}
        isDeleting={controller.deletingTransactionId === item.id}
        isDuplicating={controller.duplicatingTransactionId === item.id}
        isPaying={controller.payingTransactionId === item.id}
        onDetails={handleDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkPaid={handleMarkPaid}
        onDuplicate={handleDuplicate}
      />
    ),
    [
      controller.deletingTransactionId,
      controller.duplicatingTransactionId,
      controller.payingTransactionId,
      handleDelete,
      handleDetails,
      handleDuplicate,
      handleEdit,
      handleMarkPaid,
    ],
  );

  return (
    <>
      <FlashList
        data={controller.transactions}
        keyExtractor={extractTransactionKey}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmptyComponent}
        contentContainerStyle={listContainerStyle}
        ItemSeparatorComponent={ListSeparator}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        testID="transactions-flashlist"
      />
      <TransactionDetailModal
        transaction={detailTransaction}
        onClose={handleCloseDetails}
        onShowInstallmentGroup={controller.handleShowInstallmentGroup}
      />
      <MarkPaidConfirmModal
        target={payTarget}
        isSubmitting={controller.payingTransactionId !== null}
        onConfirm={(txId, paidAt) => {
          void controller.handleMarkPaid(txId, paidAt);
          setPayTarget(null);
        }}
        onClose={() => setPayTarget(null)}
      />
      <DeleteConfirmModal
        target={deleteTarget}
        isDeleting={controller.deletingTransactionId !== null}
        onConfirm={(txId, scope) => {
          void controller.handleDelete(txId, scope);
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </>
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
  readonly isPaying: boolean;
  readonly onDetails: (txId: string) => void;
  readonly onEdit: (txId: string) => void;
  readonly onDelete: (txId: string) => void;
  readonly onMarkPaid: (txId: string) => void;
  readonly onDuplicate: (txId: string) => void;
}

 
const TransactionRow = function TransactionRow({
  tx,
  isDeleting,
  isDuplicating,
  isPaying,
  onDetails,
  onEdit,
  onDelete,
  onMarkPaid,
  onDuplicate,
}: TransactionRowProps): ReactElement {
  const installmentLabel = getInstallmentLabel(tx);
  const isBusy = isDeleting || isDuplicating || isPaying;
  const handleDetails = useCallback(() => {
    onDetails(tx.id);
  }, [onDetails, tx.id]);

  const handleEdit = useCallback(() => {
    onEdit(tx.id);
  }, [onEdit, tx.id]);

  const handleDelete = useCallback(() => {
    onDelete(tx.id);
  }, [onDelete, tx.id]);

  const handleMarkPaid = useCallback(() => {
    onMarkPaid(tx.id);
  }, [onMarkPaid, tx.id]);

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
              {installmentLabel ? (
                <AppBadge tone="default">{installmentLabel}</AppBadge>
              ) : null}
            </YStack>
            <AppBadge tone={STATUS_TONE[tx.status] ?? "default"}>{tx.status}</AppBadge>
          </XStack>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={handleDetails} disabled={isBusy}>
          Detalhes
        </AppButton>
        {tx.status !== "paid" ? (
          <AppButton onPress={handleMarkPaid} disabled={isBusy}>
            {isPaying ? "Pagando..." : "Pagar"}
          </AppButton>
        ) : null}
        <AppButton tone="secondary" onPress={handleEdit} disabled={isBusy}>
          Editar
        </AppButton>
        <AppButton tone="secondary" onPress={handleDuplicate} disabled={isBusy}>
          {isDuplicating ? "Duplicando..." : "Duplicar"}
        </AppButton>
        <AppButton tone="secondary" onPress={handleDelete} disabled={isBusy}>
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
};

interface TransactionDetailModalProps {
  readonly transaction: TransactionViewModel | null;
  readonly onClose: () => void;
  readonly onShowInstallmentGroup: (installmentGroupId: string) => void;
}

function TransactionDetailModal({
  transaction,
  onClose,
  onShowInstallmentGroup,
}: TransactionDetailModalProps): ReactElement {
  const installmentLabel = transaction ? getInstallmentLabel(transaction) : null;
  const installmentGroupId = transaction?.installmentGroupId ?? null;
  const visible = Boolean(transaction);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
        <YStack
          backgroundColor="$background"
          padding="$4"
          gap="$3"
          borderTopLeftRadius="$3"
          borderTopRightRadius="$3"
        >
          {transaction ? (
            <AppSurfaceCard title="Detalhes da transacao" description={transaction.title}>
              <YStack gap="$3">
                <AppKeyValueRow
                  label="Valor"
                  value={`${transaction.type === "income" ? "+" : "-"}${transaction.amount}`}
                  helperText={formatShortDate(transaction.dueDate)}
                />
                <AppKeyValueRow label="Status" value={transaction.status} />
                {installmentLabel ? (
                  <AppKeyValueRow label="Parcelamento" value={installmentLabel} />
                ) : null}
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
                <AppButton onPress={onClose}>Fechar</AppButton>
              </YStack>
            </AppSurfaceCard>
          ) : null}
        </YStack>
      </YStack>
    </Modal>
  );
}

const getInstallmentLabel = (tx: TransactionViewModel): string | null => {
  if (!tx.isInstallment || !tx.installmentCount) {
    return null;
  }
  if (tx.installmentNumber) {
    return `Parcela ${tx.installmentNumber}/${tx.installmentCount}`;
  }
  return `Parcelado em ${tx.installmentCount}x`;
};
