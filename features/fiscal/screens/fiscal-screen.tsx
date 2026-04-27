import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

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
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppQueryState } from "@/shared/components/app-query-state";
import { FiscalDocumentsSkeleton } from "@/shared/skeletons";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const STATUS_TONE: Record<string, "default" | "primary" | "danger"> = {
  pending: "default",
  partial: "default",
  reconciled: "primary",
  overdue: "danger",
};

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
    <AppScreen>
      <SummaryCard controller={controller} />
      <ReceivablesListCard controller={controller} />
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
  return (
    <AppSurfaceCard
      title="Recebiveis"
      description="Lance, marque como recebido ou exclua entradas."
    >
      <AppQueryState
        query={controller.receivablesQuery}
        options={{
          loading: {
            title: "Carregando recebiveis",
            description: "Buscando entradas registradas.",
          },
          empty: {
            title: "Nenhum recebivel cadastrado",
            description: "Use o botao acima para cadastrar o primeiro.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar a lista",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: (data) => data.receivables.length === 0,
        }}
        loadingComponent={<FiscalDocumentsSkeleton rows={4} />}
        emptyComponent={
          <AppEmptyState
            illustration="fiscal"
            title="Nenhum recebivel cadastrado"
            description="Cadastre o primeiro para acompanhar pagamentos esperados e recebidos."
            cta={{
              label: "Novo recebivel",
              onPress: controller.handleOpenCreate,
            }}
          />
        }
      >
        {(data) => (
          <YStack gap="$3">
            {data.receivables.map((record) => (
              <ReceivableRow
                key={record.id}
                record={record}
                isMarking={controller.markingReceivableId === record.id}
                isDeleting={controller.deletingReceivableId === record.id}
                onMarkReceived={() => {
                  void controller.handleMarkReceived(record.id);
                }}
                onDelete={() => {
                  void controller.handleDelete(record.id);
                }}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface ReceivableRowProps {
  readonly record: ReceivableRecord;
  readonly isMarking: boolean;
  readonly isDeleting: boolean;
  readonly onMarkReceived: () => void;
  readonly onDelete: () => void;
}

function ReceivableRow({
  record,
  isMarking,
  isDeleting,
  onMarkReceived,
  onDelete,
}: ReceivableRowProps): ReactElement {
  const isReconciled = record.reconciliationStatus === "reconciled";
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
            onPress={onMarkReceived}
            disabled={isMarking || isDeleting}
          >
            {isMarking ? "Marcando..." : "Marcar recebido"}
          </AppButton>
        ) : null}
        <AppButton
          tone="secondary"
          onPress={onDelete}
          disabled={isMarking || isDeleting}
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
}
