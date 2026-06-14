import { useCallback, useMemo, useState, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Modal, Pressable, RefreshControl } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { queryKeys } from "@/core/query/query-keys";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { IMPORT_FEATURE_FLAG_KEY } from "@/features/import/import-config";
import { AiInsightSurface } from "@/features/insights/components/ai-insight-surface";
import { FinancialCalendar } from "@/features/transactions/components/financial-calendar";
import {
  DeleteConfirmModal,
  MarkPaidConfirmModal,
  type DeleteTarget,
  type MarkPaidTarget,
} from "@/features/transactions/components/transaction-action-modals";
import { TransactionActionSheet } from "@/features/transactions/components/transaction-action-sheet";
import { TransactionBottomSheet } from "@/features/transactions/components/transaction-bottom-sheet";
import {
  PeriodNavigator,
  TransactionFilterControls,
} from "@/features/transactions/components/transaction-filters";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { TransactionRow } from "@/features/transactions/components/transaction-row";
import { useTransactionsExport } from "@/features/transactions/hooks/use-transactions-export";
import {
  useTransactionsScreenController,
  type TransactionsScreenController,
  type TransactionViewModel,
} from "@/features/transactions/hooks/use-transactions-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { useListRefresh } from "@/shared/hooks/use-list-refresh";
import { useT } from "@/shared/i18n";
import { TransactionListSkeleton } from "@/shared/skeletons";
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";
import { formatCurrency } from "@/shared/utils/formatters";

const TRANSACTIONS_REFRESH_KEYS = [
  queryKeys.transactions.list(),
  queryKeys.transactions.summary(),
] as const;

/**
 * Canonical transactions screen composition for the mobile app.
 *
 * @returns List with collapsed header and swipe/tap actions, or active form.
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

  const listHeader = (
    <YStack gap="$4" paddingBottom="$2">
      <FilterHeader controller={controller} />
      <AiInsightSurface dimension="transactions" />
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

  // Lista: filtros colapsados + insight rolam JUNTO com os itens
  // (ListHeaderComponent), deixando as transações visíveis na dobra.
  return (
    <AppScreen scrollable={false}>
      <TransactionsListCard controller={controller} listHeader={listHeader} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: TransactionsScreenController;
}

interface HeaderIconButtonProps {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly accessibilityLabel: string;
  readonly color: string;
  readonly onPress: () => void;
  readonly badgeColor?: string;
}

/** Botão só-ícone do cabeçalho (44×44), com dot opcional de filtro ativo. */
function HeaderIconButton({
  icon,
  accessibilityLabel,
  color,
  onPress,
  badgeColor,
}: HeaderIconButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
    >
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      {badgeColor ? (
        <YStack
          position="absolute"
          top={9}
          right={9}
          width={9}
          height={9}
          borderRadius={9}
          backgroundColor={badgeColor}
        />
      ) : null}
    </Pressable>
  );
}

interface HeaderActionsRowProps extends ControllerProps {
  readonly iconColor: string;
  readonly badgeColor: string;
  readonly onOpenFilters: () => void;
  readonly onOpenExport: () => void;
}

/** Saldo do período (esquerda) + ações em ícones (direita). */
function HeaderActionsRow({
  controller,
  iconColor,
  badgeColor,
  onOpenFilters,
  onOpenExport,
}: HeaderActionsRowProps): ReactElement {
  const positive = controller.monthBalance >= 0;
  return (
    <XStack alignItems="center" justifyContent="space-between">
      <YStack>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Saldo do período
        </Paragraph>
        <Paragraph
          color={positive ? "$success" : "$danger"}
          fontFamily="$body"
          fontSize="$6"
          fontWeight="$7"
        >
          {formatCurrency(controller.monthBalance)}
        </Paragraph>
      </YStack>
      <XStack alignItems="center">
        <HeaderIconButton
          icon={
            controller.viewMode === "list"
              ? "calendar-month-outline"
              : "format-list-bulleted"
          }
          accessibilityLabel={
            controller.viewMode === "list" ? "Ver calendário" : "Ver lista"
          }
          color={iconColor}
          onPress={() =>
            controller.setViewMode(
              controller.viewMode === "list" ? "calendar" : "list",
            )
          }
        />
        <HeaderIconButton
          icon="filter-variant"
          accessibilityLabel="Filtros"
          color={iconColor}
          onPress={onOpenFilters}
          badgeColor={controller.hasActiveFilters ? badgeColor : undefined}
        />
        <HeaderIconButton
          icon="tray-arrow-up"
          accessibilityLabel="Exportar"
          color={iconColor}
          onPress={onOpenExport}
        />
      </XStack>
    </XStack>
  );
}

function FilterHeader({ controller }: ControllerProps): ReactElement {
  const { t } = useT();
  const router = useRouter();
  const isDark = useResolvedTheme() === "auraxis_dark";
  const palette = isDark ? darkSemanticColors : lightSemanticColors;
  const [exportSheetOpen, setExportSheetOpen] = useState<boolean>(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState<boolean>(false);
  const exportRunner = useTransactionsExport();
  const importEnabled = isFeatureEnabled(IMPORT_FEATURE_FLAG_KEY);

  const handleExportFormat = useCallback(
    async (format: "csv" | "pdf"): Promise<void> => {
      await exportRunner.exportNow({ format });
      setExportSheetOpen(false);
    },
    [exportRunner],
  );

  return (
    <YStack gap="$3">
      <PeriodNavigator
        periodLabel={controller.periodLabel}
        onPreviousMonth={controller.goToPreviousMonth}
        onNextMonth={controller.goToNextMonth}
      />
      <HeaderActionsRow
        controller={controller}
        iconColor={palette.mutedForeground}
        badgeColor={palette.primary}
        onOpenFilters={() => setFilterSheetOpen(true)}
        onOpenExport={() => setExportSheetOpen(true)}
      />
      {importEnabled ? (
        <AppButton
          tone="secondary"
          size="sm"
          onPress={() => router.push(appRoutes.private.importTransactions)}
        >
          Importar planilha
        </AppButton>
      ) : null}
      <InstallmentGroupFilterNotice controller={controller} />
      <FilterSheet
        visible={filterSheetOpen}
        controller={controller}
        onClose={() => setFilterSheetOpen(false)}
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
    </YStack>
  );
}

interface FilterSheetProps extends ControllerProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

function FilterSheet({ visible, controller, onClose }: FilterSheetProps): ReactElement {
  return (
    <TransactionBottomSheet
      visible={visible}
      onClose={onClose}
      testID="transaction-filter-sheet"
    >
      <Paragraph fontFamily="$body" fontWeight="$7" fontSize="$5" color="$color">
        Filtros
      </Paragraph>
      <TransactionFilterControls
        typeFilter={controller.typeFilter}
        onTypeFilterChange={controller.setTypeFilter}
        statusFilter={controller.statusFilter}
        onStatusFilterChange={controller.setStatusFilter}
        tagFilter={controller.tagFilter}
        onTagFilterChange={controller.setTagFilter}
        onClearFilters={controller.clearFilters}
      />
      <AppButton onPress={onClose}>Aplicar</AppButton>
    </TransactionBottomSheet>
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
      <AppButton
        tone="secondary"
        size="sm"
        onPress={controller.handleClearInstallmentGroupFilter}
      >
        Mostrar todas
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
        description="Crie uma nova transacao no botao central ou troque o filtro para visualizar movimentos."
      />
    );
  }, [query.isPending, query.isError, query.error]);

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
  const [actionTarget, setActionTarget] = useState<TransactionViewModel | null>(null);
  const [payTarget, setPayTarget] = useState<MarkPaidTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const openActions = useCallback((tx: TransactionViewModel): void => {
    setActionTarget(tx);
  }, []);

  const requestPay = useCallback(
    (txId: string): void => {
      const tx = controller.transactions.find((item) => item.id === txId);
      if (tx) {
        setActionTarget(null);
        setPayTarget({ id: tx.id, title: tx.title });
      }
    },
    [controller.transactions],
  );

  const requestDelete = useCallback(
    (txId: string): void => {
      const tx = controller.transactions.find((item) => item.id === txId);
      if (tx) {
        setActionTarget(null);
        setDeleteTarget({
          id: tx.id,
          title: tx.title,
          isSeries: tx.isRecurring || tx.isInstallment,
        });
      }
    },
    [controller.transactions],
  );

  const handleEdit = useCallback(
    (txId: string): void => {
      const record = controller.transactionsQuery.data?.transactions.find(
        (item) => item.id === txId,
      );
      if (record) {
        setActionTarget(null);
        controller.handleOpenEdit(record);
      }
    },
    [controller],
  );

  const handleDuplicate = useCallback(
    (txId: string): void => {
      setActionTarget(null);
      void controller.handleDuplicate(txId);
    },
    [controller],
  );

  const handleShowInstallmentGroup = useCallback(
    (installmentGroupId: string): void => {
      setActionTarget(null);
      controller.handleShowInstallmentGroup(installmentGroupId);
    },
    [controller],
  );

  const renderItem = useCallback(
    ({ item }: { readonly item: TransactionViewModel }) => (
      <TransactionRow
        tx={item}
        onOpenActions={openActions}
        onMarkPaid={requestPay}
        onDelete={requestDelete}
      />
    ),
    [openActions, requestPay, requestDelete],
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
        ItemSeparatorComponent={RowSeparator}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        testID="transactions-flashlist"
      />
      <TransactionActionSheet
        transaction={actionTarget}
        isPaying={controller.payingTransactionId !== null}
        isDuplicating={controller.duplicatingTransactionId !== null}
        isDeleting={controller.deletingTransactionId !== null}
        onClose={() => setActionTarget(null)}
        onMarkPaid={requestPay}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={requestDelete}
        onShowInstallmentGroup={handleShowInstallmentGroup}
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

function RowSeparator(): ReactElement {
  return <YStack height={1} backgroundColor="$borderColor" />;
}
