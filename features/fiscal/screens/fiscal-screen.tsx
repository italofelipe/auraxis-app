import { useCallback, useMemo, type ReactElement } from "react";

import { FlashList } from "@shopify/flash-list";
import { RefreshControl } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { queryKeys } from "@/core/query/query-keys";
import { FiscalDocumentsCard } from "@/features/fiscal/components/fiscal-documents-card";
import { ReceivableForm } from "@/features/fiscal/components/receivable-form";
import type {
  ReceivableRecord,
  RevenueSummary,
} from "@/features/fiscal/contracts";
import {
  useFiscalScreenController,
  type FiscalScreenController,
} from "@/features/fiscal/hooks/use-fiscal-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useListRefresh } from "@/shared/hooks/use-list-refresh";
import { FiscalDocumentsSkeleton } from "@/shared/skeletons";

const STATUS_TONE: Record<string, "default" | "primary" | "danger"> = {
  pending: "default",
  partial: "default",
  reconciled: "primary",
  overdue: "danger",
};

const FISCAL_REFRESH_KEYS = [
  queryKeys.fiscal.receivables(),
  queryKeys.fiscal.summary(),
] as const;

const extractKey = (item: ReceivableRecord): string => item.id;
const listContainerStyle = { paddingBottom: 24 } as const;

function ListSeparator(): ReactElement {
  return <YStack height="$2" />;
}

/**
 * Canonical fiscal receivables screen for the mobile app.
 *
 * @returns Summary card + list with create / mark-received / delete actions.
 */
export function FiscalScreen(): ReactElement {
  const controller = useFiscalScreenController();

  if (controller.formMode === "create") {
    return (
      <AppScreen>
        <ReceivableForm
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
      <SummaryCard controller={controller} />
      <YStack flex={1}>
        <ReceivablesListCard controller={controller} />
      </YStack>
      <FiscalDocumentsCard />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: FiscalScreenController;
}

function SummaryCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Recebimentos"
      description="Resumo das suas notas fiscais e recebimentos esperados."
    >
      <YStack gap="$3">
        <AppQueryState
          query={controller.summaryQuery}
          options={{
            loading: {
              title: "Carregando resumo",
              description: "Buscando totalizadores.",
            },
            empty: {
              title: "Sem dados ainda",
              description: "Cadastre seu primeiro recebivel para comecar.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar o resumo",
              fallbackDescription: "Tente novamente em instantes.",
            },
          }}
        >
          {(summary) => <SummaryRows summary={summary} />}
        </AppQueryState>
        <AppButton onPress={controller.handleOpenCreate}>Novo recebivel</AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function SummaryRows({ summary }: { readonly summary: RevenueSummary }): ReactElement {
  return (
    <YStack gap="$2">
      <AppKeyValueRow label="Esperado" value={`R$ ${summary.expectedTotal}`} />
      <AppKeyValueRow label="Recebido" value={`R$ ${summary.receivedTotal}`} />
      <AppKeyValueRow label="Pendente" value={`R$ ${summary.pendingTotal}`} />
    </YStack>
  );
}

function ReceivablesListCard({ controller }: ControllerProps): ReactElement {
  const queryStateOptions = useMemo(
    () => ({
      loading: {
        title: "Carregando recebiveis",
        description: "Buscando entradas registradas.",
      },
      loadingPresentation: "skeleton" as const,
      empty: {
        title: "Nenhum recebivel cadastrado",
        description: "Use o botao acima para cadastrar o primeiro.",
      },
      error: {
        fallbackTitle: "Nao foi possivel carregar a lista",
        fallbackDescription: "Tente novamente em instantes.",
      },
      isEmpty: (data: { readonly receivables: readonly ReceivableRecord[] }) =>
        data.receivables.length === 0,
    }),
    [],
  );

  const emptyComponent = useMemo(
    () => (
      <AppEmptyState
        illustration="fiscal"
        title="Nenhum recebivel cadastrado"
        description="Cadastre o primeiro para acompanhar pagamentos esperados e recebidos."
        cta={{
          label: "Novo recebivel",
          onPress: controller.handleOpenCreate,
        }}
      />
    ),
    [controller.handleOpenCreate],
  );

  return (
    <AppQueryState
      query={controller.receivablesQuery}
      options={queryStateOptions}
      loadingComponent={<FiscalDocumentsSkeleton rows={4} />}
      emptyComponent={emptyComponent}
    >
      {(data) => (
        <ReceivablesList
          receivables={data.receivables}
          controller={controller}
        />
      )}
    </AppQueryState>
  );
}

interface ReceivablesListProps {
  readonly receivables: readonly ReceivableRecord[];
  readonly controller: FiscalScreenController;
}

function ReceivablesList({
  receivables,
  controller,
}: ReceivablesListProps): ReactElement {
  const { refreshing, onRefresh } = useListRefresh(FISCAL_REFRESH_KEYS);

  const handleMarkReceived = useCallback(
    (id: string): void => {
      void controller.handleMarkReceived(id);
    },
    [controller],
  );

  const handleDelete = useCallback(
    (id: string): void => {
      void controller.handleDelete(id);
    },
    [controller],
  );

  const renderItem = useCallback(
    ({ item }: { readonly item: ReceivableRecord }) => (
      <ReceivableRow
        record={item}
        isMarking={controller.markingReceivableId === item.id}
        isDeleting={controller.deletingReceivableId === item.id}
        onMarkReceived={handleMarkReceived}
        onDelete={handleDelete}
      />
    ),
    [
      controller.deletingReceivableId,
      controller.markingReceivableId,
      handleDelete,
      handleMarkReceived,
    ],
  );

  return (
    <FlashList
      data={receivables}
      keyExtractor={extractKey}
      renderItem={renderItem}
      contentContainerStyle={listContainerStyle}
      ItemSeparatorComponent={ListSeparator}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      testID="fiscal-receivables-flashlist"
    />
  );
}

interface ReceivableRowProps {
  readonly record: ReceivableRecord;
  readonly isMarking: boolean;
  readonly isDeleting: boolean;
  readonly onMarkReceived: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

const ReceivableRow = function ReceivableRow({
  record,
  isMarking,
  isDeleting,
  onMarkReceived,
  onDelete,
}: ReceivableRowProps): ReactElement {
  const isReconciled = record.reconciliationStatus === "reconciled";
  const handleMark = useCallback(
    () => onMarkReceived(record.id),
    [onMarkReceived, record.id],
  );
  const handleDelete = useCallback(
    () => onDelete(record.id),
    [onDelete, record.id],
  );

  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={`NF ${record.fiscalDocumentId.slice(0, 8)}`}
        value={
          <YStack alignItems="flex-end" gap="$1">
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              R$ {record.expectedNetAmount ?? "0,00"}
            </Paragraph>
            <AppBadge tone={STATUS_TONE[record.reconciliationStatus] ?? "default"}>
              {record.reconciliationStatus}
            </AppBadge>
          </YStack>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        {!isReconciled ? (
          <AppButton
            tone="secondary"
            onPress={handleMark}
            disabled={isMarking || isDeleting}
          >
            {isMarking ? "Marcando..." : "Marcar recebido"}
          </AppButton>
        ) : null}
        <AppButton
          tone="secondary"
          onPress={handleDelete}
          disabled={isMarking || isDeleting}
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
};
